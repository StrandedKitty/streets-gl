import TileSource from "./TileSource";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import TerrainHeightLoader, {HeightLoaderTile} from "~/app/terrain/TerrainHeightLoader";
import Utils from "~/app/Utils";
import Config from "~/app/Config";

export default class HeightTileSource extends TileSource<ImageBitmap> {
	private texture: AbstractTexture2D = null;
	private heightLoaderTile: HeightLoaderTile = null;

	public constructor(x: number, y: number, zoom: number) {
		super(x, y, zoom);
	}

	public async loadFromHeightLoader(heightLoader: TerrainHeightLoader, level: number): Promise<void> {
		const tile = await heightLoader.getOrLoadTile(this.x, this.y, this.zoom, this);

		if (this.deleted) {
			this.heightLoaderTile.tracker.release(this);
			return;
		}

		this.heightLoaderTile = tile;
		this.data = tile.getLevel(level).bitmap;
	}

	public async load(): Promise<void> {
		const url = HeightTileSource.getURL(this.x, this.y, this.zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		if (response.status !== 200) {
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
		this.deleted = true;

		if (this.data && !this.heightLoaderTile) {
			this.data.close();
		}

		if (this.heightLoaderTile) {
			this.heightLoaderTile.tracker.release(this);
		}

		if (this.texture) {
			this.texture.delete();
		}
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return Utils.resolveEndpointTemplate({
			template: Config.ElevationEndpointTemplate,
			values: {
				x: x,
				y: y,
				z: zoom
			}
		});
	}
}