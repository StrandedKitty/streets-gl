import UniversalFeatureProvider from "./UniversalFeatureProvider";
import UniversalFeatureCollection from "../UniversalFeatureCollection";
import OverpassUniversalFeatureProvider
	from "./OverpassUniversalFeatureProvider";
import MapboxUniversalFeatureProvider from "./MapboxUniversalFeatureProvider";

export default class CombinedUniversalFeatureProvider extends UniversalFeatureProvider {
	private overpassProvider: OverpassUniversalFeatureProvider = new OverpassUniversalFeatureProvider();
	private mapboxProvider: MapboxUniversalFeatureProvider = new MapboxUniversalFeatureProvider();

	public async getCollection(
		{
			x,
			y
		}: {
			x: number;
			y: number;
		}
	): Promise<UniversalFeatureCollection> {
		const mapboxData = await this.mapboxProvider.getCollection({x, y});
		const overpassData = await this.overpassProvider.getCollection({x, y});

		return this.mergeCollections(overpassData, mapboxData);
	}

	private mergeCollections(...collections: UniversalFeatureCollection[]): UniversalFeatureCollection {
		return {
			nodes: [].concat(collections.map(c => c.nodes)),
			polylines: [].concat(collections.map(c => c.polylines)),
			areas: [].concat(collections.map(c => c.areas))
		};
	}
}