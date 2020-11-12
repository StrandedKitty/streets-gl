import TileManager from "./TileManager";
import Tile from "../objects/Tile";
import TileBuilding from "./TileBuilding";

export default class TileObjectsManager {
	private tileManager: TileManager;
	private buildingsList: Map<number, TileBuilding> = new Map();

	constructor(tileManager: TileManager) {
		this.tileManager = tileManager;
	}

	public addTile(tile: Tile) {
		for(const packedId of tile.buildingOffsetMap.keys()) {
			const object = this.buildingsList.get(packedId);

			if(object) {
				object.addParent(tile);
			} else {
				const building = new TileBuilding(packedId);
				building.addParent(tile);
				this.buildingsList.set(packedId, building);
			}
		}
	}

	public removeTile(tile: Tile) {
		if(!tile.buildingOffsetMap) {
			return;
		}

		for(const packedId of tile.buildingOffsetMap.keys()) {
			const object = this.buildingsList.get(packedId);

			if(object) {
				object.removeParent(tile);
			}
		}
	}

	public update() {
		for(const tile of this.tileManager.tiles.values()) {
			if(tile.buildings && !tile.buildingsUpdated) {
				this.addTile(tile);
				tile.buildingsUpdated = true;
			}
		}
	}
}