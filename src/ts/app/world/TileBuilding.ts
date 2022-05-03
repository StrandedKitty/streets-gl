import Tile from "../objects/Tile";

export default class TileBuilding {
	private readonly id: number;
	private parents: Tile[] = [];
	private holder: Tile = null;

	constructor(id: number) {
		this.id = id;
	}

	public addParent(tile: Tile) {
		if(this.holder && this.holder.isBuildingVisible(this.id)) {
			this.holder.hideBuilding(this.id);
		}

		this.holder = tile;
		this.parents.push(this.holder);
	}

	public removeParent(tile: Tile) {
		for(let i = 0; i < this.parents.length; i++) {
			if(tile === this.parents[i]) {
				this.parents.splice(i, 1);

				if(tile === this.holder && this.parents.length > 0) {
					this.holder = this.getPotentialHolder();

					if(!this.holder.isBuildingVisible(this.id)) {
						this.holder.showBuilding(this.id);
					}
				}

				if(this.parents.length === 0) {
					this.holder = null;
				}

				return;
			}
		}
	}

	private getPotentialHolder() {
		return this.parents[this.parents.length - 1];
	}
}