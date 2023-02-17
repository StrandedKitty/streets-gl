import {FeatureProvider} from "~/lib/tile-processing/types";
import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";

export default abstract class Tile3DFeatureProvider implements FeatureProvider<Tile3DFeatureCollection>{
	public abstract getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number
		}
	): Promise<Tile3DFeatureCollection>;
}