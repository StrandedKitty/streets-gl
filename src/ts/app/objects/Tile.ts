import Object3D from "../../core/Object3D";
import Ground from "./Ground";
import Renderer from "../../renderer/Renderer";
import {tile2meters} from "../../math/Utils";
import Texture2D from "../../renderer/Texture2D";
import GLConstants from "../../renderer/GLConstants";
import HeightProvider from "../HeightProvider";

export default class Tile extends Object3D {
	public ground: Ground;
	public x: number;
	public y: number;
	public inFrustum: boolean = true;
	public colorMap: Texture2D = null;
	public heightmapCanvas: HTMLCanvasElement = null;
	public readyForRendering: boolean = false;

	constructor(x: number, y: number) {
		super();

		this.x = x;
		this.y = y;

		this.ground = null;

		HeightProvider.prepareDataForTile(x, y).then(() => {
			this.readyForRendering = true;
		});
	}

	public async createGround(renderer: Renderer) {
		this.colorMap = new Texture2D(renderer, {
			url: `http://mt1.google.com/vt/lyrs=s&x=${this.x}&y=${this.y}&z=16&scale=2`,
			anisotropy: 16,
			flipY: true,
			wrap: GLConstants.CLAMP_TO_EDGE
		});

		this.ground = new Ground(renderer);

		this.ground.applyHeightmap(this.x, this.y);

		const positionInMeters = tile2meters(this.x, this.y + 1);
		this.ground.position.set(positionInMeters.x, 0, positionInMeters.y);

		this.add(this.ground);
	}

	public dispose() {
		if (this.ground) {
			this.ground.delete();
		}

		if (this.parent) {
			this.parent.remove(this);
		}
	}
}
