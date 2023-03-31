import TileSourceFactory from "~/app/terrain/tile-source/factory/TileSourceFactory";
import WaterTileSource from "~/app/terrain/tile-source/WaterTileSource";

export default class WaterTileSourceFactory extends TileSourceFactory<WaterTileSource> {
	public create(x: number, y: number, zoom: number): WaterTileSource {
		return new WaterTileSource(x, y, zoom);
	}
}