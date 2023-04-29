import TileSourceFactory from "~/app/terrain/tile-source/factory/TileSourceFactory";
import HeightTileSource from "~/app/terrain/tile-source/HeightTileSource";

export default class HeightTileSourceFactory extends TileSourceFactory<HeightTileSource> {
	public async create(x: number, y: number, zoom: number): Promise<HeightTileSource> {
		const source = new HeightTileSource(x, y, zoom);
		await source.load();

		return source;
	}
}