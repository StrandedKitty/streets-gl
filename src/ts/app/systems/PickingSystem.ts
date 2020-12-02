import Vec2 from "../../math/Vec2";
import GLConstants from "../../renderer/GLConstants";
import Renderer from "../../renderer/Renderer";
import GBuffer from "../../renderer/GBuffer";
import {App} from "../App";
import Tile from "../objects/Tile";

export default class PickingSystem {
	private app: App;
	private pointerPosition: Vec2 = new Vec2();
	private pixelBuffer: WebGLBuffer;
	private enablePicking: boolean = true;
	public hoveredObjectId: number = 0;
	public selectedObjectId: number = 0;
	public selectedObjectLocalId: number = 0;
	public selectedObjectTile: Tile = null;
	private pointerDownPosition: Vec2 = new Vec2();

	constructor(app: App) {
		this.app = app;

		window.addEventListener('pointerdown', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;

			this.pointerDownPosition.x = e.clientX;
			this.pointerDownPosition.y = e.clientY;
		});

		window.addEventListener('pointermove', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;
		});

		window.addEventListener('pointerup', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;

			if (this.pointerDownPosition.x === e.clientX && this.pointerDownPosition.y === e.clientY) {
				this.onClick();
			}
		});

		const canvas = document.getElementById('canvas');

		canvas.addEventListener('mouseenter', e => {
			this.enablePicking = true;
		});

		canvas.addEventListener('mouseleave', e => {
			this.enablePicking = false;
		});
	}

	private createPixelBuffer(renderer: Renderer) {
		const buffer = renderer.gl.createBuffer();

		renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, buffer);
		renderer.gl.bufferData(renderer.gl.PIXEL_PACK_BUFFER, 4, renderer.gl.STATIC_DRAW);
		renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, null);

		this.pixelBuffer = buffer;
	}

	public readObjectId(renderer: Renderer, gBuffer: GBuffer) {
		if (!this.pixelBuffer) {
			this.createPixelBuffer(renderer);
		}

		if (!this.enablePicking) {
			this.hoveredObjectId = 0;
		}

		renderer.gl.readBuffer(GLConstants.COLOR_ATTACHMENT6);

		const data = new Uint32Array(1);
		const offset = this.pointerPosition;
		const width = 1;
		const height = 1;
		const format = GLConstants.RED_INTEGER;
		const type = GLConstants.UNSIGNED_INT;

		renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, this.pixelBuffer);
		renderer.gl.readPixels(offset.x, gBuffer.height - offset.y - 1, width, height, format, type, 0);
		renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, null);

		renderer.fence().then(() => {
			renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, this.pixelBuffer);
			renderer.gl.getBufferSubData(renderer.gl.PIXEL_PACK_BUFFER, 0, data);
			renderer.gl.bindBuffer(renderer.gl.PIXEL_PACK_BUFFER, null);

			this.hoveredObjectId = data[0];
			this.updatePointer();
		});
	}

	private updatePointer() {
		if (this.hoveredObjectId > 0 && this.enablePicking) {
			this.app.cursorStyleSystem.enablePointer();
		} else {
			this.app.cursorStyleSystem.disablePointer();
		}
	}

	private onClick() {
		if (this.hoveredObjectId === 0 || this.hoveredObjectId === this.selectedObjectId) {
			this.selectedObjectId = 0;
			return;
		}

		if (this.hoveredObjectId !== 0) {
			this.selectedObjectId = this.hoveredObjectId;

			const selectedValue = this.selectedObjectId - 1;

			const localTileId = selectedValue >> 16;
			const tile = this.app.tileManager.getTileByLocalId(localTileId);
			const localFeatureId = selectedValue & 0xffff;
			const packedFeatureId = tile.buildingIdMap.get(localFeatureId);

			const [type, id] = Tile.unpackFeatureId(packedFeatureId);

			this.selectedObjectLocalId = localFeatureId;
			this.selectedObjectTile = tile;

			console.log(`clicked ${type} ${id}`);
		}
	}

	public update() {

	}
}