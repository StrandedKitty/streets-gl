import TileSourceFactory from "~/app/terrain/tile-source/factory/TileSourceFactory";
import HeightTileSource from "~/app/terrain/tile-source/HeightTileSource";

export default class HeightTileSourceFactory extends TileSourceFactory<HeightTileSource> {
	public create(x: number, y: number, zoom: number): HeightTileSource {
		return new HeightTileSource(x, y, zoom);
	}
}