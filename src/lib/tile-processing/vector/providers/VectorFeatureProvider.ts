import {FeatureProvider} from "~/lib/tile-processing/types";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";

export default abstract class VectorFeatureProvider implements FeatureProvider<VectorFeatureCollection>{
	public abstract getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number;
		}
	): Promise<VectorFeatureCollection>;
}