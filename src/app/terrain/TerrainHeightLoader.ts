import TerrainHeightLoaderBitmap from "~/app/terrain/TerrainHeightLoaderBitmap";

export default class TerrainHeightLoader {
	private readonly tiles: Map<string, Map<number, TerrainHeightLoaderBitmap>> = new Map();

	public async load(
		x: number,
		y: number,
		zoom: number,
		downscaleTimes: number,
		ownerId: symbol
	): Promise<void> {
		//this.removeUnusedTiles();

		const url = TerrainHeightLoader.getURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		}).catch(e => {
			console.error(e);
		});

		if (!response) {
			return;
		}

		const blob = await response.blob();
		const bitmap = await createImageBitmap(blob);
		const decoded = TerrainHeightLoader.decodeBitmap(bitmap);
		decoded.tracker.use(ownerId);

		this.addBitmap(decoded, x, y, zoom, 0);

		for (let i = 0; i < downscaleTimes; i++) {
			const tx = Math.floor(x / (2 ** i));
			const ty = Math.floor(y / (2 ** i));

			const downscaled = decoded.downscale();
			downscaled.tracker.use(ownerId);

			this.addBitmap(downscaled, tx, ty, zoom, i + 1);
		}
	}

	private addBitmap(bitmap: TerrainHeightLoaderBitmap, x: number, y: number, zoom: number, level: number): void {
		const key = `${x},${y},${zoom}`;

		if (!this.tiles.has(key)) {
			this.tiles.set(key, new Map());
		}

		this.tiles.get(key).set(level, bitmap);
	}

	private removeUnusedTiles(): void {
		for (const tile of this.tiles.values()) {
			for (const [level, bitmap] of tile.entries()) {
				if (!bitmap.tracker.isUsed()) {
					console.log(tile, level)
					bitmap.delete();
					tile.delete(level);
				}
			}
		}
	}

	public getBitmap(x: number, y: number, zoom: number, level: number): TerrainHeightLoaderBitmap {
		const tile = this.tiles.get(`${x},${y},${zoom}`);

		if (!tile) {
			return null;
		}

		return tile.get(level);
	}

	public async getOrLoadBitmap(
		x: number,
		y: number,
		zoom: number,
		level: number,
		ownerId: symbol
	): Promise<TerrainHeightLoaderBitmap> {
		const loaded = this.getBitmap(x, y, zoom, level);

		if (loaded) {
			loaded.tracker.use(ownerId);
			return Promise.resolve(loaded);
		}

		await this.load(x, y, zoom, 1, ownerId);
		return this.getBitmap(x, y, zoom, level);
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