import Vec2 from "../../math/Vec2";
import Tile from "../objects/Tile";
import System from "../System";
import SystemManager from "../SystemManager";
import CursorStyleSystem from "./CursorStyleSystem";
import TileSystem from "./TileSystem";
import UISystem from "./UISystem";

export default class PickingSystem extends System {
	public pointerPosition: Vec2 = new Vec2();
	private enablePicking = true;
	public hoveredObjectId = 0;
	public selectedObjectId = 0;
	public selectedObjectLocalId = 0;
	public selectedObjectTile: Tile = null;
	public pointerDownPosition: Vec2 = new Vec2();

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		const canvas = document.getElementById('canvas');

		canvas.addEventListener('pointerdown', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;

			this.pointerDownPosition.x = e.clientX;
			this.pointerDownPosition.y = e.clientY;
		});

		canvas.addEventListener('pointermove', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;
		});

		canvas.addEventListener('pointerup', e => {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;

			if (this.pointerDownPosition.x === e.clientX && this.pointerDownPosition.y === e.clientY) {
				this.onClick();
			}
		});

		canvas.addEventListener('mouseenter', e => {
			this.enablePicking = true;
		});

		canvas.addEventListener('mouseleave', e => {
			this.enablePicking = false;
		});
	}

	public postInit(): void {

	}

	public readObjectId(buffer: Uint32Array): void {
		/*if (!this.pixelBuffer) {
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
		});*/

		this.hoveredObjectId = buffer[0];
		this.updatePointer();
	}

	private updatePointer(): void {
		if (this.hoveredObjectId > 0 && this.enablePicking) {
			this.systemManager.getSystem(CursorStyleSystem).enablePointer();
		} else {
			this.systemManager.getSystem(CursorStyleSystem).disablePointer();
		}
	}

	private onClick(): void {
		if (this.hoveredObjectId === 0 || this.hoveredObjectId === this.selectedObjectId) {
			this.clearSelection();
			return;
		}

		if (this.hoveredObjectId !== 0) {
			this.selectedObjectId = this.hoveredObjectId;

			const selectedValue = this.selectedObjectId - 1;

			const localTileId = selectedValue >> 16;
			const tile = this.systemManager.getSystem(TileSystem).getTileByLocalId(localTileId);
			const localFeatureId = selectedValue & 0xffff;
			const packedFeatureId = tile.buildingIdMap.get(localFeatureId);

			const [type, id] = Tile.unpackFeatureId(packedFeatureId);

			this.selectedObjectLocalId = localFeatureId;
			this.selectedObjectTile = tile;

			console.log(`clicked ${type} ${id}`);
			this.systemManager.getSystem(UISystem).setActiveFeature(type, id);
		}
	}

	public clearSelection(): void {
		this.selectedObjectId = 0;
		this.systemManager.getSystem(UISystem).clearActiveFeature();
	}

	public update(deltaTime: number): void {

	}
}