import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Tile3DFeatureProvider from "~/lib/tile-processing/tile3d/providers/Tile3DFeatureProvider";
import CombinedVectorFeatureProvider from "~/lib/tile-processing/vector/providers/CombinedVectorFeatureProvider";

export default class Tile3DFromVectorProvider extends Tile3DFeatureProvider {
	private vectorProvider: CombinedVectorFeatureProvider = new CombinedVectorFeatureProvider();

	public async getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number;
		}
	): Promise<Tile3DFeatureCollection> {
		const vectorTile = await this.vectorProvider.getCollection({x, y, zoom});

		//console.log(x, y, vectorTile);

		return new Promise(resolve => {});
	}
}