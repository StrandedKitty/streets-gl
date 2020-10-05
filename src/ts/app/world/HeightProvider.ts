export default new class HeightProvider {
	private tiles: Map<string, Uint8ClampedArray> = new Map();
	private requests: Map<string, Promise<void>> = new Map();
	private ctx: CanvasRenderingContext2D;

	constructor() {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		this.ctx = canvas.getContext('2d');
	}

	public getTile(x: number, y: number): Uint8ClampedArray {
		return this.tiles.get(`${x},${y}`);
	}

	public async getTileAsync(x: number, y: number): Promise<Uint8ClampedArray> {
		return new Promise<Uint8ClampedArray>(async resolve => {
			if (!this.getTile(x, y)) {
				await this.fetchTile(x, y);
			}

			resolve(this.tiles.get(`${x},${y}`));
		})
	}

	public getHeight(tileX: number, tileY: number, x: number, y: number): number {
		const position = {
			x: Math.floor(x * 255),
			y: Math.floor(y * 255)
		};

		let tile = this.getTile(tileX, tileY);

		if (position.x === 255 && position.y === 255) {
			tile = this.getTile(tileX + 1, tileY + 1);
			position.x = 0;
			position.y = 0;
		} else if (position.x === 255) {
			tile = this.getTile(tileX + 1, tileY);
			position.x = 0;
		} else if (position.y === 255) {
			tile = this.getTile(tileX, tileY + 1);
			position.y = 0;
		}

		const start = (position.x + position.y * 256) * 4;
		const pixel = [tile[start], tile[start + 1], tile[start + 2]];

		return -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1);
	}

	public async prepareDataForTile(x: number, y: number): Promise<void[]> {
		const promises: Promise<void>[] = [];
		const positions: [number, number][] = [
			[x, y],
			[x + 1, y],
			[x, y + 1],
			[x + 1, y + 1]
		];

		for (const position of positions) {
			if (!this.getTile(position[0], position[1])) {
				promises.push(this.fetchTile(position[0], position[1]));
			}
		}

		return Promise.all<void>(promises);
	}

	private async fetchTile(x: number, y: number): Promise<void> {
		let promise = this.requests.get(`${x},${y}`);

		if (promise) {
			return promise;
		}

		promise = new Promise<void>(resolve => {
			const image = new Image();

			image.onload = () => {
				this.ctx.drawImage(image, 0, 0);

				const data = this.ctx.getImageData(0, 0, 256, 256).data;

				this.tiles.set(`${x},${y}`, data);
				this.requests.delete(`${x},${y}`);

				resolve();
			}

			image.crossOrigin = "anonymous";
			image.src = this.getTileURL(x, y, 16);
		});

		this.requests.set(`${x},${y}`, promise);

		return promise;
	}

	private getTileURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.png?access_token=pk.eyJ1Ijoidmhhd2siLCJhIjoiY2pzYnpwdmEwMGdrcDRhbno2dm0zcjU5ciJ9.iqwsJLv8ndiVKh30zDnvCQ`;
	}
}
