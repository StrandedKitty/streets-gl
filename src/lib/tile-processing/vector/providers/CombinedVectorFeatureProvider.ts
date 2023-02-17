import MapboxVectorFeatureProvider from "~/lib/tile-processing/vector/providers/MapboxVectorFeatureProvider";
import VectorFeatureProvider from "~/lib/tile-processing/vector/providers/VectorFeatureProvider";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import OverpassVectorFeatureProvider from "~/lib/tile-processing/vector/providers/OverpassVectorFeatureProvider";

export default class CombinedVectorFeatureProvider extends VectorFeatureProvider {
	private overpassProvider: OverpassVectorFeatureProvider = new OverpassVectorFeatureProvider();
	private mapboxProvider: MapboxVectorFeatureProvider = new MapboxVectorFeatureProvider();

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
	): Promise<VectorFeatureCollection> {
		//const mapboxRequest = this.mapboxProvider.getCollection({x, y, zoom});
		return await this.overpassProvider.getCollection({x, y, zoom});

		/*return new Promise((resolve, reject) => {
			Promise.allSettled([mapboxRequest, overpassRequest]).then(([mapboxData, overpassData]) => {
				if (overpassData.status === 'fulfilled' && mapboxData.status === 'fulfilled') {
					const merged = this.mergeCollections(overpassData.value, mapboxData.value);
					resolve(merged);
					return;
				}

				reject();
			})
		});*/
	}

	private mergeCollections(...collections: VectorFeatureCollection[]): VectorFeatureCollection {
		return {
			nodes: [].concat(...collections.map(c => c.nodes)),
			polylines: [].concat(...collections.map(c => c.polylines)),
			areas: [].concat(...collections.map(c => c.areas))
		};
	}
}