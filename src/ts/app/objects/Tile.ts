import Object3D from "../../core/Object3D";
import Ground from "./Ground";
import Renderer from "../../renderer/Renderer";
import MathUtils from "../../math/MathUtils";
import Texture2D from "../../renderer/Texture2D";
import GLConstants from "../../renderer/GLConstants";
import HeightProvider from "../world/HeightProvider";
import StaticGeometryLoadingSystem from "../systems/StaticGeometryLoadingSystem";
import Camera from "../../core/Camera";
import Mesh from "../../renderer/Mesh";
import Vec3 from "../../math/Vec3";
import Vec2 from "../../math/Vec2";
import {AttributeFormat} from "../../renderer/Attribute";
import AbstractRenderer from "../../renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "../../renderer/RendererTypes";
import AttributeType = RendererTypes.AttributeType;
import AbstractMesh from "../../renderer/abstract-renderer/AbstractMesh";

export interface GroundGeometryBuffers {
	position: Float32Array;
	uv: Float32Array;
	normal: Float32Array;
	index: Uint32Array;
}

export interface StaticTileGeometry {
	buildings: {
		position: Float32Array;
		uv: Float32Array;
		normal: Float32Array;
		textureId: Uint8Array;
		color: Uint8Array;
		id: Uint32Array;
		offset: Uint32Array;
		localId: Uint32Array;
	};
	ground: GroundGeometryBuffers;
	roads: {
		position: Float32Array;
		uv: Float32Array;
		normal: Float32Array;
		textureId: Uint8Array;
	};
	bbox: {
		min: number[];
		max: number[];
	};
	bboxGround: {
		min: number[];
		max: number[];
	};
}

let tileCounter = 0;

export default class Tile extends Object3D {
	public ground: Ground;
	public buildings: Mesh;
	public roads: Mesh;
	public staticGeometry: StaticTileGeometry;
	public buildingIdMap: Map<number, number> = new Map();
	public buildingOffsetMap: Map<number, [number, number]> = new Map();
	public buildingVisibilityMap: Map<number, boolean> = new Map();
	public displayBufferNeedsUpdate = false;
	public x: number;
	public y: number;
	public localId: number;
	public inFrustum = true;
	public distanceToCamera: number = null;
	public colorMap: Texture2D = null;
	public readyForRendering = false;
	public buildingsUpdated = false;
	public disposed = false;
	public buildingsMesh: AbstractMesh;

	public constructor(x: number, y: number) {
		super();

		this.x = x;
		this.y = y;

		this.localId = tileCounter++;

		if (tileCounter > 65535) {
			tileCounter = 0;
		}

		this.updatePosition();
	}

	private updatePosition(): void {
		const positionInMeters = MathUtils.tile2meters(this.x, this.y + 1);

		this.position.set(positionInMeters.x, 0, positionInMeters.y);
		this.updateMatrix();
	}

	public async load(tileProvider: StaticGeometryLoadingSystem): Promise<void> {
		return Promise.all([
			//this.loadTextures(renderer),
			HeightProvider.prepareDataForTile(this.x, this.y),
			tileProvider.getTileObjects(this),
		]).then(([a, objects]: [void[], StaticTileGeometry]) => {
			this.staticGeometry = objects;
			this.updateStaticGeometryOffsets();
			this.readyForRendering = true;
		});
	}

	private async loadTextures(renderer: Renderer): Promise<void> {
		this.colorMap = new Texture2D(renderer, {
			anisotropy: 16,
			flipY: true,
			wrap: GLConstants.CLAMP_TO_EDGE,
			width: 512,
			height: 512
		});

		const hdTileX = this.x * 2;
		const hdTileY = this.y * 2;

		this.colorMap.loadFromTiles([
			`https://a.tile.openstreetmap.org/17/${hdTileX}/${hdTileY + 1}.png`,
			`https://b.tile.openstreetmap.org/17/${hdTileX + 1}/${hdTileY + 1}.png`,
			`https://c.tile.openstreetmap.org/17/${hdTileX}/${hdTileY}.png`,
			`https://a.tile.openstreetmap.org/17/${hdTileX + 1}/${hdTileY}.png`
		], 2, 2);

		return this.colorMap.loadingPromise;
	}

	public createGround(renderer: Renderer, neighbors: Tile[]): void {
		/*this.ground = new Ground(renderer);
		this.ground.applyHeightmap(this.x, this.y);

		this.add(this.ground);

		this.ground.updateBorderNormals(this.x, this.y, neighbors.filter((tile) => tile.ground));*/
	}

	public createMeshes(renderer: AbstractRenderer): void {
		this.buildingsMesh = renderer.createMesh({
			attributes: [
				renderer.createAttribute({
					name: 'position',
					size: 3,
					type: AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					data: this.staticGeometry.buildings.position
				}),
				renderer.createAttribute({
					name: 'normal',
					size: 3,
					type: AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					data: this.staticGeometry.buildings.normal
				}),
				renderer.createAttribute({
					name: 'color',
					size: 3,
					type: AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Float,
					normalized: true,
					data: this.staticGeometry.buildings.color
				}),
				renderer.createAttribute({
					name: 'uv',
					size: 2,
					type: AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					data: this.staticGeometry.buildings.uv
				}),
				renderer.createAttribute({
					name: 'textureId',
					size: 1,
					type: AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Integer,
					normalized: false,
					data: this.staticGeometry.buildings.textureId
				}),
				renderer.createAttribute({
					name: 'localId',
					size: 1,
					type: AttributeType.UnsignedInt,
					format: RendererTypes.AttributeFormat.Integer,
					normalized: false,
					data: this.staticGeometry.buildings.localId
				})
			]
		});
	}

	public generateMeshes(renderer: Renderer): void {
		const buildings = new Mesh(renderer, {
			vertices: this.staticGeometry.buildings.position,
			bboxCulled: true
		});

		const roads = new Mesh(renderer, {
			vertices: this.staticGeometry.roads.position
		});

		const ground = new Ground(renderer, this.staticGeometry);

		this.add(ground);

		buildings.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});
		buildings.setAttributeData('uv', this.staticGeometry.buildings.uv);

		buildings.addAttribute({
			name: 'normal',
			size: 3,
			type: GLConstants.FLOAT,
			normalized: false
		});
		buildings.setAttributeData('normal', this.staticGeometry.buildings.normal);

		buildings.addAttribute({
			name: 'textureId',
			size: 1,
			dataFormat: AttributeFormat.Integer,
			type: GLConstants.UNSIGNED_BYTE,
			normalized: false
		});
		buildings.setAttributeData('textureId', this.staticGeometry.buildings.textureId);

		buildings.addAttribute({
			name: 'color',
			size: 3,
			type: GLConstants.UNSIGNED_BYTE,
			normalized: true
		});
		buildings.setAttributeData('color', this.staticGeometry.buildings.color);

		buildings.addAttribute({
			name: 'display',
			size: 1,
			dataFormat: AttributeFormat.Integer,
			type: GLConstants.UNSIGNED_BYTE,
			normalized: false
		});
		buildings.setAttributeData('display', new Uint8Array(buildings.vertices.length / 3));

		buildings.addAttribute({
			name: 'localId',
			size: 1,
			dataFormat: AttributeFormat.Integer,
			type: GLConstants.UNSIGNED_INT,
			normalized: false
		});
		buildings.setAttributeData('localId', this.staticGeometry.buildings.localId);

		buildings.setBoundingBox(
			new Vec3(...this.staticGeometry.bbox.min),
			new Vec3(...this.staticGeometry.bbox.max)
		);

		this.add(buildings);

		roads.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});
		roads.setAttributeData('uv', this.staticGeometry.roads.uv);

		roads.addAttribute({
			name: 'normal',
			size: 3,
			type: GLConstants.FLOAT,
			normalized: false
		});
		roads.setAttributeData('normal', this.staticGeometry.roads.normal);

		roads.addAttribute({
			name: 'textureId',
			size: 1,
			dataFormat: AttributeFormat.Integer,
			type: GLConstants.UNSIGNED_BYTE,
			normalized: false
		});
		roads.setAttributeData('textureId', this.staticGeometry.roads.textureId);

		this.add(roads);

		this.buildings = buildings;
		this.roads = roads;
		this.ground = ground;
	}

	public updateDistanceToCamera(camera: Camera): void {
		const worldPosition = MathUtils.tile2meters(this.x + 0.5, this.y + 0.5);
		this.distanceToCamera = Math.sqrt((worldPosition.x - camera.position.x) ** 2 + (worldPosition.y - camera.position.z) ** 2);
	}

	private updateStaticGeometryOffsets(): void {
		const ids = this.staticGeometry.buildings.id;
		const offsets = this.staticGeometry.buildings.offset;
		const vertexCount = this.staticGeometry.buildings.position.length / 3;

		for (let i = 0; i < ids.length; i += 2) {
			const id = MathUtils.shiftLeft(ids[i + 1] & 0x7FFFF, 32) + ids[i];
			const type = ids[i + 1] >> 19;

			const packedId = Tile.packFeatureId(id, type);

			const offset = offsets[i / 2];
			const nextOffset = offsets[i / 2 + 1] || vertexCount;
			this.buildingIdMap.set(i / 2, packedId);
			this.buildingOffsetMap.set(packedId, [offset, nextOffset - offset]);
			this.buildingVisibilityMap.set(packedId, true);
		}
	}

	public hideBuilding(id: number): void {
		const [start, size] = this.buildingOffsetMap.get(id);
		const displayBuffer = this.buildings.attributes.get('display').buffer;

		for (let i = start; i < start + size; i++) {
			displayBuffer[i] = 255;
		}

		this.buildingVisibilityMap.set(id, false);
		this.displayBufferNeedsUpdate = true;
	}

	public showBuilding(id: number): void  {
		const [start, size] = this.buildingOffsetMap.get(id);
		const displayBuffer = this.buildings.attributes.get('display').buffer;

		for (let i = start; i < start + size; i++) {
			displayBuffer[i] = 0;
		}

		this.buildingVisibilityMap.set(id, true);
		this.displayBufferNeedsUpdate = true;
	}

	public isBuildingVisible(id: number): boolean {
		return this.buildingVisibilityMap.get(id);
	}

	public updateDisplayBuffer(): void  {
		this.buildings.updateAttribute('display');
	}

	public dispose(): void  {
		this.disposed = true;

		if (this.ground) {
			this.ground.delete();
		}

		if (this.buildingsMesh) {
			this.buildingsMesh.delete();
		}

		if (this.colorMap) {
			this.colorMap.delete();
		}

		if (this.parent) {
			this.parent.remove(this);
		}
	}

	public static encodePosition(x: number, y: number): number {
		return x << 16 + y;
	}

	public static decodePosition(encoded: number): Vec2 {
		return new Vec2(encoded >> 16, encoded & 0xffff);
	}

	public static packFeatureId(id: number, type: number): number {
		return MathUtils.shiftLeft(type, 51) + id;
	}

	public static unpackFeatureId(packedId: number): [number, number] {
		const type = MathUtils.shiftRight(packedId, 51);
		let id = packedId;

		if (id >= 2 ** 52) {
			id -= 2 ** 52;
		}
		if (id >= 2 ** 51) {
			id -= 2 ** 51;
		}

		return [type, id];
	}
}
