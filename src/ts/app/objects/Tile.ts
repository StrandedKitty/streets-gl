import Object3D from "../../core/Object3D";
import Ground from "./Ground";
import Renderer from "../../renderer/Renderer";
import {tile2meters} from "../../math/Utils";
import Texture2D from "../../renderer/Texture2D";
import GLConstants from "../../renderer/GLConstants";
import HeightProvider from "../world/HeightProvider";
import TileProvider from "../world/TileProvider";
import Camera from "../../core/Camera";
import Mesh from "../../renderer/Mesh";
import Vec3 from "../../math/Vec3";
import Config from "../Config";

export interface StaticTileGeometry {
	buildings: {
		position: Float32Array,
		uv: Float32Array,
		color?: Float32Array
	},
	bbox: {
		min: number[],
		max: number[]
	}
}

export default class Tile extends Object3D {
	public ground: Ground;
	public buildings: Mesh;
	public staticGeometry: StaticTileGeometry;
	public x: number;
	public y: number;
	public inFrustum: boolean = true;
	public distanceToCamera: number = null;
	public colorMap: Texture2D = null;
	public readyForRendering: boolean = false;
	public disposed = false;

	constructor(x: number, y: number) {
		super();

		this.x = x;
		this.y = y;

		this.ground = null;

		const positionInMeters = tile2meters(this.x, this.y + 1);
		this.position.set(positionInMeters.x, 0, positionInMeters.y);
	}

	public load(tileProvider: TileProvider) {
		Promise.all([
			HeightProvider.prepareDataForTile(this.x, this.y),
			tileProvider.getTileObjects(this)
		]).then(([_, objects]: [void[], StaticTileGeometry]) => {
			this.staticGeometry = objects;
			this.readyForRendering = true;
		});
	}

	public createGround(renderer: Renderer, neighbors: Tile[]) {
		this.colorMap = new Texture2D(renderer, {
			url: `http://mt1.google.com/vt/lyrs=s&x=${this.x}&y=${this.y}&z=16&scale=2`,
			anisotropy: 16,
			flipY: true,
			wrap: GLConstants.CLAMP_TO_EDGE
		});

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

		buildings.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});
		buildings.setAttributeData('uv', this.staticGeometry.buildings.uv);

		buildings.setBoundingBox(
			new Vec3(...this.staticGeometry.bbox.min),
			new Vec3(...this.staticGeometry.bbox.max)
		);

		this.buildings = buildings;

		this.add(buildings);
	}

	public updateDistanceToCamera(camera: Camera) {
		const worldPosition = tile2meters(this.x + 0.5, this.y + 0.5);
		this.distanceToCamera = Math.sqrt((worldPosition.x - camera.position.x) ** 2 + (worldPosition.y - camera.position.z) ** 2);
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
}
