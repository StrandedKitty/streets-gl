export default new class HeightProvider {
	private tiles: Map<string, Uint8ClampedArray> = new Map();
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

	public getHeight(tileX: number, tileY: number, x: number, y: number): number {
		const position = {
			x: Math.floor(x * 255),
			y: Math.floor(y * 255)
		};

		let tile = this.getTile(tileX, tileY);

		if(position.x === 255 && position.y === 255) {
			tile = this.getTile(tileX + 1, tileY + 1);
			position.x = 0;
			position.y = 0;
		} else if(position.x === 255) {
			tile = this.getTile(tileX + 1, tileY);
			position.x = 0;
		} else if(position.y === 255) {
			tile = this.getTile(tileX, tileY + 1);
			position.y = 0;
		}

		const start = (position.x + position.y * 256) * 4;
		const pixel = [tile[start], tile[start + 1], tile[start + 2]];

		return -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1);
	}

	public async prepareDataForTile(x: number, y: number): Promise<void[]> {
		const promises: Promise<void>[] = [];

		if(!this.getTile(x, y)) {
			promises.push(this.fetchTile(x, y));
		}

		if(!this.getTile(x + 1, y)) {
			promises.push(this.fetchTile(x + 1, y));
		}

		if(!this.getTile(x, y + 1)) {
			promises.push(this.fetchTile(x, y + 1));
		}

		if(!this.getTile(x + 1, y + 1)) {
			promises.push(this.fetchTile(x + 1, y + 1));
		}

		return Promise.all<void>(promises);
	}

	private async fetchTile(x: number, y: number): Promise<void> {
		return new Promise<void>(resolve => {
			const image = new Image();

			image.onload = () => {
				this.ctx.drawImage(image, 0, 0);

				const data = this.ctx.getImageData(0, 0, 256, 256).data;
				this.tiles.set(`${x},${y}`, data);

				resolve();
			}

			image.crossOrigin = "anonymous";
			image.src = this.getTileURL(x, y, 16);
		});
	}

	private getTileURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.png?access_token=pk.eyJ1Ijoidmhhd2siLCJhIjoiY2pzYnpwdmEwMGdrcDRhbno2dm0zcjU5ciJ9.iqwsJLv8ndiVKh30zDnvCQ`;
	}
}
