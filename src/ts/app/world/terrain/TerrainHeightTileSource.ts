export default class TerrainHeightTileSource {
	public bitmap: ImageBitmap = null;
	private deleted: boolean = false;

	public constructor(public x: number, public y: number, public zoom: number) {
		this.load();
	}

	private async load(): Promise<void> {
		const url = TerrainHeightTileSource.getURL(this.x, this.y, this.zoom);
		const response = await fetch(url, {
			method: 'GET'
		}).catch(e => {
			console.error(e);
		});

		if (!response) {
			return;
		}

		const blob = await response.blob();

		if (this.deleted) {
			return;
		}

		const bitmap = await createImageBitmap(blob);

		if (!this.deleted) {
			this.bitmap = bitmap;
		}
	}

	public delete(): void {
		if (this.bitmap) {
			this.deleted = true;
			this.bitmap.close();
		}
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}@2x.png?access_token=pk.eyJ1Ijoidmhhd2siLCJhIjoiY2pzYnpwdmEwMGdrcDRhbno2dm0zcjU5ciJ9.iqwsJLv8ndiVKh30zDnvCQ`;
	}
}