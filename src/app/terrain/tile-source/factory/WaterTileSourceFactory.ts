import TileSourceFactory from "~/app/terrain/tile-source/factory/TileSourceFactory";
import WaterTileSource from "~/app/terrain/tile-source/WaterTileSource";

export default class WaterTileSourceFactory extends TileSourceFactory<WaterTileSource> {
	public async create(x: number, y: number, zoom: number): Promise<WaterTileSource> {
		const source = new WaterTileSource(x, y, zoom);
		await source.load();

		return source;
	}
}