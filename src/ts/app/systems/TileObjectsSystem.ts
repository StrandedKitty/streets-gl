import TileSystem from "./TileSystem";
import Tile from "../objects/Tile";
import TileBuilding from "../world/TileBuilding";
import System from "../System";
import SystemManager from "../SystemManager";

export default class TileObjectsSystem extends System {
	private buildingsList: Map<number, TileBuilding> = new Map();

	constructor(systemManager: SystemManager) {
		super(systemManager);
	}

	public postInit() {

	}

	public addTile(tile: Tile) {
		for (const packedId of tile.buildingOffsetMap.keys()) {
			const object = this.buildingsList.get(packedId);

			if (object) {
				object.addParent(tile);
			} else {
				const building = new TileBuilding(packedId);
				building.addParent(tile);
				this.buildingsList.set(packedId, building);
			}
		}
	}

	public removeTile(tile: Tile) {
		if (!tile.buildingOffsetMap) {
			return;
		}

		for (const packedId of tile.buildingOffsetMap.keys()) {
			const object = this.buildingsList.get(packedId);

			if (object) {
				object.removeParent(tile);
			}
		}
	}

	public update(deltaTime: number) {
		for (const tile of this.systemManager.getSystem(TileSystem).tiles.values()) {
			if (tile.buildings && !tile.buildingsUpdated) {
				this.addTile(tile);
				tile.buildingsUpdated = true;
			}
		}
	}
}