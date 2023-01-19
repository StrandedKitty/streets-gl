import Vec2 from "~/lib/math/Vec2";
import Tile from "../objects/Tile";
import System from "../System";
import SystemManager from "../SystemManager";
import CursorStyleSystem from "./CursorStyleSystem";
import TileSystem from "./TileSystem";
import UISystem from "./UISystem";
import TileObjectsSystem from "./TileObjectsSystem";
import TileBuilding from "../world/TileBuilding";

export default class PickingSystem extends System {
	public pointerPosition: Vec2 = new Vec2();
	private enablePicking = true;
	public hoveredObjectId = 0;
	public selectedObjectId = 0;
	public selectedTileBuilding: TileBuilding = null;
	public pointerDownPosition: Vec2 = new Vec2();

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		const canvas = document.getElementById('canvas');

		canvas.addEventListener('pointerdown', e => {
			if (e.button !== 0) {
				return;
			}

			this.updatePointerPositionFromEvent(e, true);
		});

		canvas.addEventListener('pointermove', e => {
			this.updatePointerPositionFromEvent(e);
		});

		canvas.addEventListener('pointerup', e => {
			if (e.button !== 0) {
				return;
			}

			this.updatePointerPositionFromEvent(e);

			if (this.pointerDownPosition.x === this.pointerPosition.x && this.pointerDownPosition.y === this.pointerPosition.y) {
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

	private updatePointerPositionFromEvent(e: PointerEvent, updatePointerDown: boolean = false): void {
		if (document.pointerLockElement !== null) {
			this.pointerPosition.x = Math.floor(window.innerWidth / 2);
			this.pointerPosition.y = Math.floor(window.innerHeight / 2);
		} else {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;
		}

		if (updatePointerDown) {
			this.pointerDownPosition.x = this.pointerPosition.x;
			this.pointerDownPosition.y = this.pointerPosition.y;
		}
	}

	public readObjectId(buffer: Uint32Array): void {
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
			const packedFeatureId = tile.buildingLocalToPackedMap.get(localFeatureId);

			const [type, id] = Tile.unpackFeatureId(packedFeatureId);

			const tileObjectsSystem = this.systemManager.getSystem(TileObjectsSystem);
			this.selectedTileBuilding = tileObjectsSystem.getTileBuildingByPackedId(packedFeatureId);

			this.systemManager.getSystem(UISystem).setActiveFeature(type, id);
		}
	}

	public clearSelection(): void {
		this.selectedObjectId = 0;
		this.selectedTileBuilding = null;
		this.systemManager.getSystem(UISystem).clearActiveFeature();
	}

	public update(deltaTime: number): void {

	}
}