import Object3D from "../../core/Object3D";
import Ground from "./Ground";
import Renderer from "../../renderer/Renderer";
import MathUtils from "../../math/MathUtils";
import Texture2D from "../../renderer/Texture2D";
import GLConstants from "../../renderer/GLConstants";
import HeightProvider from "../world/HeightProvider";
import TileProvider from "../world/TileProvider";
import Camera from "../../core/Camera";
import Mesh from "../../renderer/Mesh";
import Vec3 from "../../math/Vec3";
import Vec2 from "../../math/Vec2";
import {AttributeFormat} from "../../renderer/Attribute";

export interface StaticTileGeometry {
	buildings: {
		position: Float32Array,
		uv: Float32Array,
		textureId: Uint8Array,
		color: Uint8Array,
		id: Uint32Array,
		offset: Uint32Array,
		localId: Uint32Array
	},
	bbox: {
		min: number[],
		max: number[]
	}
}

let tileCounter = 0;

export default class Tile extends Object3D {
	public ground: Ground;
	public buildings: Mesh;
	public staticGeometry: StaticTileGeometry;
	public buildingOffsetMap: Map<number, [number, number]>;
	public buildingVisibilityMap: Map<number, boolean>;
	public displayBufferNeedsUpdate: boolean = false;
	public x: number;
	public y: number;
	public localId: number;
	public inFrustum: boolean = true;
	public distanceToCamera: number = null;
	public colorMap: Texture2D = null;
	public readyForRendering: boolean = false;
	public buildingsUpdated: boolean = false;
	public disposed: boolean = false;

	constructor(x: number, y: number) {
		super();

		this.x = x;
		this.y = y;

		this.localId = tileCounter++;

		if(tileCounter > 65535) {
			tileCounter = 0;
		}

		this.ground = null;

		const positionInMeters = MathUtils.tile2meters(this.x, this.y + 1);
		this.position.set(positionInMeters.x, 0, positionInMeters.y);
		this.updateMatrix();
	}

	public async load(tileProvider: TileProvider, renderer: Renderer): Promise<void> {
		return Promise.all([
			this.loadTextures(renderer),
			HeightProvider.prepareDataForTile(this.x, this.y),
			tileProvider.getTileObjects(this),
		]).then(([a, b, objects]: [void, void[], StaticTileGeometry]) => {
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
			`https://a.tile.openstreetmap.org/17/${hdTileX + 1}/${hdTileY }.png`
		], 2, 2);

		return this.colorMap.loadingPromise;
	}

	public createGround(renderer: Renderer, neighbors: Tile[]) {
		this.ground = new Ground(renderer);
		this.ground.applyHeightmap(this.x, this.y);

		this.add(this.ground);

		this.ground.updateBorderNormals(this.x, this.y, neighbors.filter((tile) => tile.ground));
	}

	public generateMeshes(renderer: Renderer) {
		const buildings = new Mesh(renderer, {
			vertices: this.staticGeometry.buildings.position,
			bboxCulled: true
		});

		const vertexCount = buildings.vertices.length / 3;

		buildings.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});
		buildings.setAttributeData('uv', this.staticGeometry.buildings.uv);

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
		buildings.setAttributeData('display', new Uint8Array(vertexCount));

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

		this.buildings = buildings;

		this.add(buildings);
	}

	public updateDistanceToCamera(camera: Camera) {
		const worldPosition = MathUtils.tile2meters(this.x + 0.5, this.y + 0.5);
		this.distanceToCamera = Math.sqrt((worldPosition.x - camera.position.x) ** 2 + (worldPosition.y - camera.position.z) ** 2);
	}

	private updateStaticGeometryOffsets() {
		const offsetMap: Map<number, [number, number]> = new Map();
		const visibilityMap: Map<number, boolean> = new Map();
		const ids = this.staticGeometry.buildings.id;
		const offsets = this.staticGeometry.buildings.offset;
		const vertexCount = this.staticGeometry.buildings.position.length / 3;

		for(let i = 0; i < ids.length; i += 2) {
			const id = MathUtils.shiftLeft(ids[i + 1], 32) + ids[i];
			const type = ids[i + 1] & 0xC000;

			const packedId = MathUtils.shiftLeft(type, 51) + id;

			const offset = offsets[i / 2];
			const nextOffset = offsets[i / 2 + 1] || vertexCount;
			offsetMap.set(packedId, [offset, nextOffset - offset]);
			visibilityMap.set(packedId, true);
		}

		this.buildingOffsetMap = offsetMap;
		this.buildingVisibilityMap = visibilityMap;
	}

	public hideBuilding(id: number) {
		const [start, size] = this.buildingOffsetMap.get(id);
		const displayBuffer = this.buildings.attributes.get('display').buffer;

		for(let i = start; i < start + size; i++) {
			displayBuffer[i] = 255;
		}

		this.buildingVisibilityMap.set(id, false);
		this.displayBufferNeedsUpdate = true;
	}

	public showBuilding(id: number) {
		const [start, size] = this.buildingOffsetMap.get(id);
		const displayBuffer = this.buildings.attributes.get('display').buffer;

		for(let i = start; i < start + size; i++) {
			displayBuffer[i] = 0;
		}

		this.buildingVisibilityMap.set(id, true);
		this.displayBufferNeedsUpdate = true;
	}

	public isBuildingVisible(id: number): boolean {
		return this.buildingVisibilityMap.get(id);
	}

	public updateDisplayBuffer() {
		this.buildings.updateAttribute('display');
	}

	public dispose() {
		this.disposed = true;

		if (this.ground) {
			this.ground.delete();
		}

		if (this.buildings) {
			this.buildings.delete();
		}

		if (this.parent) {
			this.parent.remove(this);
		}
	}

	public getEncodedPosition(): number {
		return Tile.encodePosition(this.x, this.y);
	}

	public static encodePosition(x: number, y: number): number {
		return x << 16 + y;
	}

	public static decodePosition(encoded: number): Vec2 {
		return new Vec2(encoded >> 16, encoded & 0xffff);
	}
}
