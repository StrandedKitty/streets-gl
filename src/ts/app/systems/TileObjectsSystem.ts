import TileSystem from "./TileSystem";
import Tile from "../objects/Tile";
import TileBuilding from "../world/TileBuilding";
import System from "../System";
import SystemManager from "../SystemManager";

export default class TileObjectsSystem extends System {
	private buildingsList: Map<number, TileBuilding> = new Map();

	public constructor(systemManager: SystemManager) {
		super(systemManager);
	}

	public postInit(): void {

	}

	public addTile(tile: Tile): void {
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

	public removeTile(tile: Tile): void {
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

	public getTileBuildingByPackedId(id: number): TileBuilding {
		return this.buildingsList.get(id);
	}

	public update(deltaTime: number): void {
		for (const tile of this.systemManager.getSystem(TileSystem).tiles.values()) {
			if (tile.buildings && tile.buildingsNeedFiltering) {
				this.addTile(tile);
				tile.buildingsNeedFiltering = false;
			}
		}
	}
}