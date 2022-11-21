import UniversalFeatureProvider from "~/app/world/universal-features/providers/UniversalFeatureProvider";
import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";
import OverpassUniversalFeatureProvider
	from "~/app/world/universal-features/providers/OverpassUniversalFeatureProvider";
import MapboxUniversalFeatureProvider from "~/app/world/universal-features/providers/MapboxUniversalFeatureProvider";
import HeightViewer from "~/app/world/HeightViewer";
import {GroundGeometryData} from "~/app/world/universal-features/providers/GroundGeometryBuilder";

export default class CombinedUniversalFeatureProvider extends UniversalFeatureProvider {
	private overpassProvider: OverpassUniversalFeatureProvider = new OverpassUniversalFeatureProvider();
	private mapboxProvider: MapboxUniversalFeatureProvider = new MapboxUniversalFeatureProvider();

	public async getCollection(
		{
			x,
			y,
			heightViewer,
			groundData
		}: {
			x: number;
			y: number;
			heightViewer: HeightViewer;
			groundData: GroundGeometryData;
		}
	): Promise<UniversalFeatureCollection> {
		const mapboxData = await this.mapboxProvider.getCollection({x, y, heightViewer, groundData});

		return this.mergeCollections([mapboxData]);
	}

	private mergeCollections(collections: UniversalFeatureCollection[]): UniversalFeatureCollection {
		return collections[0]; // todo
	}
}