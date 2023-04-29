import TileSource from "~/app/terrain/tile-source/TileSource";

export default abstract class TileSourceFactory<T extends TileSource<any>> {
	public abstract create(x: number, y: number, zoom: number): Promise<T>;
}