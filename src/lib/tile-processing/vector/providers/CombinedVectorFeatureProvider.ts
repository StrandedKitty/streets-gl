import MapboxVectorFeatureProvider from "~/lib/tile-processing/vector/providers/MapboxVectorFeatureProvider";
import VectorFeatureProvider from "~/lib/tile-processing/vector/providers/VectorFeatureProvider";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import OverpassVectorFeatureProvider from "~/lib/tile-processing/vector/providers/OverpassVectorFeatureProvider";
import {Tile3DProviderParams} from "~/lib/tile-processing/tile3d/providers/Tile3DFromVectorProvider";

export default class CombinedVectorFeatureProvider extends VectorFeatureProvider {
	private readonly overpassProvider: OverpassVectorFeatureProvider;
	private readonly mapboxProvider: MapboxVectorFeatureProvider;

	public constructor(params: Tile3DProviderParams) {
		super();

		this.overpassProvider = new OverpassVectorFeatureProvider(
			params.overpassEndpoint,
			params.useCached
		);
		this.mapboxProvider = new MapboxVectorFeatureProvider(
			params.mapboxEndpointTemplate,
			params.mapboxAccessToken
		);
	}

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
		const mapboxRequest = this.mapboxProvider.getCollection({x, y, zoom});
		const overpassRequest = this.overpassProvider.getCollection({x, y, zoom});

		return new Promise((resolve, reject) => {
			Promise.allSettled([mapboxRequest, overpassRequest]).then(([mapboxData, overpassData]) => {
				if (overpassData.status === 'fulfilled' && mapboxData.status === 'fulfilled') {
					const merged = this.mergeCollections(overpassData.value, mapboxData.value);
					resolve(merged);
					return;
				}

				if (overpassData.status === 'rejected') {
					reject(overpassData.reason);
					return;
				}

				if (mapboxData.status === 'rejected') {
					reject(mapboxData.reason);
					return;
				}
			});
		});
	}

	private mergeCollections(...collections: VectorFeatureCollection[]): VectorFeatureCollection {
		return {
			nodes: [].concat(...collections.map(c => c.nodes)),
			polylines: [].concat(...collections.map(c => c.polylines)),
			areas: [].concat(...collections.map(c => c.areas))
		};
	}
}