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

export default class TerrainHeightLoaderBitmap {
	public tracker: UsageTracker = new UsageTracker();
	public readonly bitmap: ImageBitmap;
	private readonly data: Float32Array;
	private readonly width: number;
	private readonly height: number;

	public constructor(bitmap: ImageBitmap, data: Float32Array, width: number, height: number) {
		this.bitmap = bitmap;
		this.data = data;
		this.width = width;
		this.height = height;
	}

	public fetchNearest(x: number, y: number): number {
		return this.data[y * this.width + x];
	}

	public fetchNearestNormalized(x: number, y: number): number {
		const texelX = Math.min(Math.floor(x * this.width), this.width - 1);
		const texelY = Math.min(Math.floor(y * this.height), this.height - 1);

		return this.fetchNearest(texelX, texelY);
	}

	public downscale(): TerrainHeightLoaderBitmap {
		const width = this.width / 2;
		const height = this.height / 2;
		const data = new Float32Array(width * height);

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const x1 = x * 2;
				const y1 = y * 2;
				const x2 = x1 + 1;
				const y2 = y1 + 1;

				const a = this.fetchNearest(x1, y1);
				const b = this.fetchNearest(x2, y1);
				const c = this.fetchNearest(x1, y2);
				const d = this.fetchNearest(x2, y2);

				data[y * width + x] = (a + b + c + d) / 4;
			}
		}

		return new TerrainHeightLoaderBitmap(null, data, width, height);
	}

	public delete(): void {
		if (this.bitmap) {
			this.bitmap.close();
		}
	}
}