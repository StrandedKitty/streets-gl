import Vec2 from "../../math/Vec2";

export default class HeightViewer {
	public readonly tiles: Map<string, Uint8ClampedArray> = new Map();
	private readonly queue: Map<string, (() => void)[]> = new Map();
	public requestHeightFunction: (x: number, y: number) => void;

	public constructor() {

	}

	public getTile(x: number, y: number): Uint8ClampedArray {
		return this.tiles.get(`${x},${y}`);
	}

	public isTileLoaded(x: number, y: number): boolean {
		return this.tiles.get(`${x},${y}`) !== undefined;
	}

	public getHeight(tileX: number, tileY: number, x: number, y: number): number {
		let positionX = Math.floor(x * 255);
		let positionY = Math.floor(y * 255);

		//positionX = Math.min(positionX, 255);
		//positionY = Math.min(positionY, 255);

		let tile = this.getTile(tileX, tileY);

		if (x === 1 && y === 1) {
			tile = this.getTile(tileX + 1, tileY + 1);
			positionX = 0;
			positionY = 0;
		} else if (x === 1) {
			tile = this.getTile(tileX + 1, tileY);
			positionX = 0;
		} else if (y === 1) {
			tile = this.getTile(tileX, tileY + 1);
			positionY = 0;
		}

		const start = (positionX + positionY * 256) * 4;

		return -10000 + ((tile[start] * 256 * 256 + tile[start + 1] * 256 + tile[start + 2]) * 0.1);
	}

	public async requestHeightTile(x: number, y: number): Promise<void> {
		return new Promise((resolve) => {
			this.requestHeightFunction(x, y);

			const tileName = `${x},${y}`;

			if (this.queue.get(tileName)) {
				this.queue.get(tileName).push(resolve);
			} else {
				this.queue.set(tileName, [resolve]);
			}
		});
	}

	public async requestTileSet(tiles: Vec2[]): Promise<void[]> {
		const promises = [];

		for (const tile of tiles) {
			if(!this.isTileLoaded(tile.x, tile.y)) {
				promises.push(this.requestHeightTile(tile.x, tile.y));
			}
		}

		return Promise.all<void>(promises);
	}

	public pushHeightTile(x: number, y: number, data: Uint8ClampedArray): void {
		const tileName = `${x},${y}`;
		const queueEntry = this.queue.get(tileName);

		this.tiles.set(tileName, data);

		if (queueEntry) {
			for (const resolve of queueEntry) {
				resolve();
			}

			this.queue.delete(tileName);
		}
	}
}