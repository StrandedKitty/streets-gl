import Vec2 from "../../math/Vec2";

export default class HeightViewer {
	public readonly tiles: Map<string, Uint8ClampedArray> = new Map();
	private readonly queue: Map<string, (() => void)[]> = new Map();
	public requestHeightFunction: (x: number, y: number) => void;

	constructor() {

	}

	public isTileLoaded(x: number, y: number): boolean {
		return this.tiles.get(`${x},${y}`) !== undefined;
	}

	public getHeight(tileX: number, tileY: number, x: number, y: number): number {
		const position = {
			x: Math.floor(x * 255),
			y: Math.floor(y * 255)
		};

		const tile = this.tiles.get(`${tileX},${tileY}`);
		const start = (position.x + position.y * 256) * 4;
		const pixel = [tile[start], tile[start + 1], tile[start + 2]];

		return -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1);
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
			promises.push(this.requestHeightTile(tile.x, tile.y));
		}

		return Promise.all<void>(promises);
	}

	public pushHeightTile(x: number, y: number, data: Uint8ClampedArray) {
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