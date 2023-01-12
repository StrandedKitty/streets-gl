import TileSource from "~/app/world/terrain/TileSource";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class HeightTileSource extends TileSource<ImageBitmap> {
	private texture: AbstractTexture2D = null;

	public constructor(x: number, y: number, zoom: number) {
		super(x, y, zoom);

		this.load();
	}

	private async load(): Promise<void> {
		const url = HeightTileSource.getURL(this.x, this.y, this.zoom);
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
			this.data = bitmap;
		}
	}

	public getTexture(renderer: AbstractRenderer): AbstractTexture2D {
		if (!this.data) {
			throw new Error();
		}

		if (!this.texture) {
			this.texture = renderer.createTexture2D({
				width: this.data.width,
				height: this.data.height,
				format: RendererTypes.TextureFormat.RGBA8Unorm,
				mipmaps: false,
				data: this.data
			});
		}

		return this.texture;
	}

	public delete(): void {
		if (this.data) {
			this.deleted = true;
			this.data.close();
		}
		if (this.texture) {
			this.texture.delete();
		}
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}@2x.png?access_token=pk.eyJ1Ijoidmhhd2siLCJhIjoiY2pzYnpwdmEwMGdrcDRhbno2dm0zcjU5ciJ9.iqwsJLv8ndiVKh30zDnvCQ`;
	}
}