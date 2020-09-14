import Object3D from "../../core/Object3D";
import Ground from "./Ground";
import Renderer from "../../renderer/Renderer";
import {tile2meters} from "../../math/Utils";
import Texture2D from "../../renderer/Texture2D";
import GLConstants from "../../renderer/GLConstants";

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

		this.loadHeightmap().then((canvas: HTMLCanvasElement) => {
			this.heightmapCanvas = canvas;
			this.readyForRendering = true;
		});
	}

	public async createGround(renderer: Renderer) {
		this.colorMap = new Texture2D(renderer, {
			url: `http://mt1.google.com/vt/lyrs=s&x=${this.x}&y=${this.y}&z=16`,
			anisotropy: 16,
			flipY: true,
			wrap: GLConstants.CLAMP_TO_EDGE
		});

		this.ground = new Ground(renderer);

		this.ground.applyHeightmap(this.heightmapCanvas);

		const positionInMeters = tile2meters(this.x, this.y + 1);
		this.ground.position.set(positionInMeters.x, 0, positionInMeters.y);

		this.add(this.ground);
	}

	private async loadHeightmap(): Promise<HTMLCanvasElement> {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext('2d');

		const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/16/${this.x}/${this.y}.png?access_token=pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMW45cjQzb2R6b2ptc3J4MSJ9.zA2W0IkI0c6KaAhJfk9bWg`;

		return new Promise<HTMLCanvasElement>(resolve => {
			const image = new Image();
			image.crossOrigin = "anonymous";

			image.onload = () => {
				ctx.drawImage(image, 0, 0);
				resolve(canvas);
			}

			image.src = url;
		});
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
