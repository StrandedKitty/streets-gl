import MapboxVectorFeatureProvider from "~/lib/tile-processing/vector/providers/MapboxVectorFeatureProvider";
import VectorFeatureProvider from "~/lib/tile-processing/vector/providers/VectorFeatureProvider";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import OverpassVectorFeatureProvider from "~/lib/tile-processing/vector/providers/OverpassVectorFeatureProvider";
import {Tile3DProviderParams} from "~/lib/tile-processing/tile3d/providers/Tile3DFromVectorProvider";
import MathUtils from "~/lib/math/MathUtils";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import PBFVectorFeatureProvider from "~/lib/tile-processing/vector/providers/PBFVectorFeatureProvider";

export default class CombinedVectorFeatureProvider extends VectorFeatureProvider {
	private readonly overpassProvider: OverpassVectorFeatureProvider;
	private readonly mapboxProvider: MapboxVectorFeatureProvider;
	private readonly pbfProvider: PBFVectorFeatureProvider;

	public constructor(params: Tile3DProviderParams) {
		super();

		this.overpassProvider = new OverpassVectorFeatureProvider(
			params.overpassEndpoint,
			params.tileServerEndpoint,
			params.useCachedTiles
		);
		this.mapboxProvider = new MapboxVectorFeatureProvider(params.vectorTilesEndpointTemplate);
		this.pbfProvider = new PBFVectorFeatureProvider();
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
		const pbfRequest = this.pbfProvider.getCollection({x, y, zoom});

		return new Promise((resolve, reject) => {
			pbfRequest.then((data) => {
				//this.clearFeaturesNotInTile(data, x, y, zoom);
				resolve(data);
			}).catch((err) => {
				reject(err);
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

	private clearFeaturesNotInTile(features: VectorFeatureCollection, x: number, y: number, zoom: number): void {
		const tileSize = MathUtils.tile2meters(0, 0, 16).x - MathUtils.tile2meters(1, 1, 16).x;

		for (let i = 0; i < features.areas.length; i++) {
			const area = features.areas[i];

			if (area.descriptor.type === 'building' && !this.isAreaInTile(area, tileSize)) {
				features.areas.splice(i, 1);
				i--;
			}
		}
	}

	private isAreaInTile(area: VectorArea, tileSize: number): boolean {
		for (const ring of area.rings) {
			for (const node of ring.nodes) {
				if (node.x >= 0 && node.x <= tileSize && node.y >= 0 && node.y <= tileSize) {
					return true;
				}
			}
		}

		return false;
	}
}