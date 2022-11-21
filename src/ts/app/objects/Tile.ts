import Object3D from "../../core/Object3D";
import MathUtils from "../../math/MathUtils";
import HeightProvider from "../world/HeightProvider";
import StaticGeometryLoadingSystem from "../systems/StaticGeometryLoadingSystem";
import Camera from "../../core/Camera";
import Vec2 from "../../math/Vec2";
import TileBuildings from "~/app/objects/TileBuildings";
import TileGround from "~/app/objects/TileGround";
import TileRoads from "~/app/objects/TileRoads";
import TileLabelBuffers from "~/app/objects/TileLabelBuffers";
import TileGroundAndBuildings from "~/app/objects/TileGroundAndBuildings";

// position.xyz, scale, rotation
export type InstanceBufferInterleaved = Float32Array;
export type InstanceType = 'tree';

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
	instancesLOD0: Record<InstanceType, InstanceBufferInterleaved>;
	instancesLOD1: Record<InstanceType, InstanceBufferInterleaved>;
	bbox: {
		min: number[];
		max: number[];
	};
	bboxGround: {
		min: number[];
		max: number[];
	};
	labels: {
		position: number[];
		priority: number[];
		text: string[];
	};
}

export type TileInstanceBuffers = Map<InstanceType, {
	rawLOD0: InstanceBufferInterleaved;
	rawLOD1: InstanceBufferInterleaved;
	transformedLOD0: InstanceBufferInterleaved;
	transformedLOD1: InstanceBufferInterleaved;
	transformOriginLOD0: Vec2;
	transformOriginLOD1: Vec2;
}>;

let tileCounter = 0;

export default class Tile extends Object3D {
	public staticGeometry: StaticTileGeometry;
	public buildingLocalToPackedMap: Map<number, number> = new Map();
	public buildingPackedToLocalMap: Map<number, number> = new Map();
	public buildingOffsetMap: Map<number, [number, number]> = new Map();
	public buildingVisibilityMap: Map<number, boolean> = new Map();
	public x: number;
	public y: number;
	public localId: number;
	public inFrustum = true;
	public distanceToCamera: number = null;
	public disposed = false;
	public buildings: TileBuildings;
	public ground: TileGround;
	public roads: TileRoads;
	public groundAndBuildings: TileGroundAndBuildings;
	public labelBuffersList: TileLabelBuffers[] = [];
	public buildingsNeedFiltering: boolean = true;
	public instanceBuffers: TileInstanceBuffers = new Map();

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
			HeightProvider.prepareDataForTile(this.x, this.y),
			tileProvider.getTileObjects(this),
		]).then(([a, objects]: [void[], StaticTileGeometry]) => {
			this.staticGeometry = objects;
			this.updateStaticGeometryOffsets();

			this.buildings = new TileBuildings(this.staticGeometry);
			this.ground = new TileGround(this.staticGeometry);
			this.roads = new TileRoads(this.staticGeometry);
			this.groundAndBuildings = new TileGroundAndBuildings(this.staticGeometry);

			this.add(this.buildings, this.ground, this.roads, this.groundAndBuildings);
			this.updateLabelBufferList();

			for (const [key, LOD0Value] of Object.entries(this.staticGeometry.instancesLOD0)) {
				const LOD1Value = this.staticGeometry.instancesLOD1[key as InstanceType];

				this.instanceBuffers.set(key as InstanceType, {
					rawLOD0: LOD0Value,
					rawLOD1: LOD1Value,
					transformedLOD0: new Float32Array(LOD0Value),
					transformedLOD1: new Float32Array(LOD1Value),
					transformOriginLOD0: new Vec2(NaN, NaN),
					transformOriginLOD1: new Vec2(NaN, NaN)
				});
			}
		});
	}

	public getInstanceBufferWithTransform(instanceName: InstanceType, lod: number, origin: Vec2): InstanceBufferInterleaved {
		const buffers = this.instanceBuffers.get(instanceName);

		if (!buffers) {
			return null;
		}

		const lodKey = lod === 0 ? 'LOD0' : 'LOD1';
		const transformed = buffers[`transformed${lodKey}`];
		const transformOrigin = buffers[`transformOrigin${lodKey}`];

		if (transformOrigin.equals(origin)) {
			return transformed;
		}

		const raw = buffers[`raw${lodKey}`];

		for (let i = 0; i < raw.length; i += 5) {
			transformed[i] = raw[i] - origin.x + this.position.x;
			transformed[i + 2] = raw[i + 2] - origin.y + this.position.z;
		}

		transformOrigin.x = origin.x;
		transformOrigin.y = origin.y;

		return transformed;
	}

	private updateLabelBufferList(): void {
		for (let i = 0; i < this.staticGeometry.labels.text.length; i++) {
			const label = new TileLabelBuffers({
				text: this.staticGeometry.labels.text[i],
				priority: this.staticGeometry.labels.priority[i],
				x: this.position.x + this.staticGeometry.labels.position[i * 3],
				y: this.position.y + this.staticGeometry.labels.position[i * 3 + 1],
				z: this.position.z + this.staticGeometry.labels.position[i * 3 + 2],
			});

			this.labelBuffersList.push(label);
		}
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
			this.buildingLocalToPackedMap.set(i / 2, packedId);
			this.buildingPackedToLocalMap.set(packedId, i / 2);
			this.buildingOffsetMap.set(packedId, [offset, nextOffset - offset]);
			this.buildingVisibilityMap.set(packedId, true);
		}
	}

	public hideBuilding(id: number): void {
		const [start, size] = this.buildingOffsetMap.get(id);

		this.buildings.addDisplayBufferPatch({start, size, value: 255});
		this.buildingVisibilityMap.set(id, false);
	}

	public showBuilding(id: number): void  {
		const [start, size] = this.buildingOffsetMap.get(id);

		this.buildings.addDisplayBufferPatch({start, size, value: 0});
		this.buildingVisibilityMap.set(id, true);
	}

	public isBuildingVisible(id: number): boolean {
		return this.buildingVisibilityMap.get(id);
	}

	public dispose(): void  {
		this.disposed = true;

		if (this.buildings) {
			this.buildings.dispose();
		}

		if (this.ground) {
			this.ground.dispose();
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
