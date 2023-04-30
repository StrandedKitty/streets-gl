import TerrainHeightLoaderBitmap from "~/app/terrain/TerrainHeightLoaderBitmap";

type AnyObject = any;

export class UsageTracker {
	private users: Set<AnyObject> = new Set();

	public use(id: AnyObject): void {
		this.users.add(id);
	}

	public release(id: AnyObject): void {
		this.users.delete(id);
	}

	public isUsed(): boolean {
		return this.users.size > 0;
	}
}

export class HeightLoaderTile {
	public tracker: UsageTracker = new UsageTracker();
	public levels: Map<number, TerrainHeightLoaderBitmap> = new Map();

	public setLevel(levelId: number, bitmap: TerrainHeightLoaderBitmap): void {
		this.levels.set(levelId, bitmap);
	}

	public getLevel(levelId: number): TerrainHeightLoaderBitmap {
		return this.levels.get(levelId);
	}

	public delete(): void {
		for (const level of this.levels.values()) {
			level.delete();
		}
	}
}

export default class TerrainHeightLoader {
	private readonly tiles: Map<string, HeightLoaderTile> = new Map();

	public async load(
		x: number,
		y: number,
		zoom: number,
		downscaleTimes: number,
		owner: AnyObject
	): Promise<void> {
		this.removeUnusedTiles();

		const url = TerrainHeightLoader.getURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		if (response.status !== 200) {
			return;
		}

		const blob = await response.blob();
		const bitmap = await createImageBitmap(blob);
		const decoded = TerrainHeightLoader.decodeBitmap(bitmap);

		this.addBitmap(decoded, x, y, zoom, 0);

		for (let i = 0; i < downscaleTimes; i++) {
			const tx = Math.floor(x / (2 ** i));
			const ty = Math.floor(y / (2 ** i));

			const downscaled = decoded.downscale();
			this.addBitmap(downscaled, tx, ty, zoom, i + 1);
		}

		this.getTile(x, y, zoom).tracker.use(owner);
	}

	private removeUnusedTiles(): void {
		for (const [key, tile] of this.tiles.entries()) {
			if (!tile.tracker.isUsed()) {
				tile.delete();
				this.tiles.delete(key);
			}
		}
	}

	public getTile(x: number, y: number, zoom: number): HeightLoaderTile {
		const key = `${x},${y},${zoom}`;
		const tile = this.tiles.get(key);

		if (tile) {
			return tile;
		}

		return null;
	}

	private addTile(x: number, y: number, zoom: number): HeightLoaderTile {
		const key = `${x},${y},${zoom}`;
		const tile = new HeightLoaderTile();

		this.tiles.set(key, tile);

		return tile;
	}

	private addBitmap(bitmap: TerrainHeightLoaderBitmap, x: number, y: number, zoom: number, level: number): void {
		let tile = this.getTile(x, y, zoom);

		if (!tile) {
			tile = this.addTile(x, y, zoom);
		}

		tile.setLevel(level, bitmap);
	}

	public getBitmap(x: number, y: number, zoom: number, level: number): TerrainHeightLoaderBitmap {
		const tile = this.getTile(x, y, zoom);

		if (!tile) {
			return null;
		}

		return tile.getLevel(level);
	}

	public async getOrLoadTile(
		x: number,
		y: number,
		zoom: number,
		owner: AnyObject
	): Promise<HeightLoaderTile> {
		const tile = this.getTile(x, y, zoom);

		if (tile) {
			tile.tracker.use(owner);

			return Promise.resolve(tile);
		}

		await this.load(x, y, zoom, 1, owner);
		return this.getTile(x, y, zoom);
	}

	private static decodeBitmap(bitmap: ImageBitmap): TerrainHeightLoaderBitmap {
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;

		const ctx = canvas.getContext('2d');
		ctx.drawImage(bitmap, 0, 0);

		const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
		const data = new Float32Array(bitmap.width * bitmap.height);

		for (let i = 0; i < data.length; i++) {
			const r = imageData.data[i * 4];
			const g = imageData.data[i * 4 + 1];
			const b = imageData.data[i * 4 + 2];

			data[i] = -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
		}

		return new TerrainHeightLoaderBitmap(bitmap, data, bitmap.width, bitmap.height);
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}@2x.png?access_token=pk.eyJ1Ijoidmhhd2siLCJhIjoiY2xmbWpqOXBoMGNmZDN2cjJwZXk0MXBzZiJ9.192VNPJG0VV9dGOCOX1gUw`;
	}
}