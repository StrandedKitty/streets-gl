import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import Pbf from 'pbf';
import {FeatureProvider} from "~/lib/tile-processing/types";
import PBFTile from "~/lib/tile-processing/vector/providers/pbf/PBFTile";
import PBFTileDecoder, {TagTypes, TagTypesMap} from "~/lib/tile-processing/vector/providers/pbf/PBFTileDecoder";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {getCollectionFromVectorFeatures} from "~/lib/tile-processing/vector/utils";
import Utils from "~/app/Utils";
import Config from "~/app/Config";
import OnegeoPolygonHandler from "~/lib/tile-processing/vector/handlers/OnegeoPolygonHandler";
import OnegeoLineStringHandler from "~/lib/tile-processing/vector/handlers/OnegeoLineStringHandler";
import OnegeoPointHandler from "~/lib/tile-processing/vector/handlers/OnegeoPointHandler";

const proto = require('./pbf/vector_tile.js').Tile;

const PBFTagTypesMap: TagTypesMap = {
	height: TagTypes.Number,
	minHeight: TagTypes.Number,
	material: TagTypes.String,
	color: TagTypes.String,
	roofMaterial: TagTypes.String,
	roofShape: TagTypes.String,
	roofColor: TagTypes.String,
	id: TagTypes.String,
	partId: TagTypes.String,
	date: TagTypes.UInt,
	orient: TagTypes.Double,
	ele: TagTypes.Double,
	class: TagTypes.String,
	subclass: TagTypes.String,
	surface: TagTypes.String,
	name: TagTypes.String,
	type: TagTypes.String,
	levels: TagTypes.UInt,
	minLevel: TagTypes.UInt,
	origId: TagTypes.UInt,
	rank: TagTypes.UInt,
	roofHeight: TagTypes.Number,
	roofDirection: TagTypes.Number,
	oneway: TagTypes.UInt,
	housenumber: TagTypes.String,
	layer: TagTypes.Number,
	roofLevels: TagTypes.UInt,
	foot: TagTypes.String,
	level: TagTypes.Number,
	brunnel: TagTypes.String,
	ref: TagTypes.String,
	service: TagTypes.String,
	bicycle: TagTypes.String,
	network: TagTypes.String,
	access: TagTypes.String,
} as const;

// TODO: Reuse code from PBFVectorFeatureProvider
export default class OnegeoVectorFeatureProvider implements FeatureProvider<VectorFeatureCollection> {
	public constructor() {
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
		const vectorTile = await OnegeoVectorFeatureProvider.fetchTile(x, y, zoom);

		const handlers = OnegeoVectorFeatureProvider.getVectorTileHandlers(vectorTile);
		const features = OnegeoVectorFeatureProvider.getFeaturesFromHandlers(handlers);

		return getCollectionFromVectorFeatures(features);
	}

	private static async fetchTile(x: number, y: number, zoom: number): Promise<VectorTile.Tile> {
		const size = 40075016.68 / (1 << zoom);
		const url = this.getTileURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		if (response.status !== 200) {
			throw new Error(`Failed to fetch tile: ${response.status}`);
		}

		const pbf = new Pbf(await response.arrayBuffer());
		const obj = proto.read(pbf) as PBFTile;

		return PBFTileDecoder.decode(obj, PBFTagTypesMap, size);
	}

	private static getTileURL(x: number, y: number, zoom: number): string {
		return Utils.resolveEndpointTemplate({
			template: Config.OnegeoEndpointTemplate,
			values: {
				x: x,
				y: y,
				z: zoom
			}
		});
	}

	private static getVectorTileHandlers(vectorTile: VectorTile.Tile): VectorTileHandler[] {
		const handlers: VectorTileHandler[] = [];

		for (const [layerName, layer] of vectorTile.layers.entries()) {
			for (const feature of layer.features) {
				switch (feature.type) {
					case VectorTile.FeatureType.Polygon: {
						handlers.push(new OnegeoPolygonHandler(feature, layerName));
						break;
					}
					case VectorTile.FeatureType.LineString: {
						handlers.push(new OnegeoLineStringHandler(feature, layerName));
						break;
					}
					case VectorTile.FeatureType.Point: {
						handlers.push(new OnegeoPointHandler(feature, layerName));
						break;
					}
				}
			}
		}

		return handlers;
	}

	private static getFeaturesFromHandlers(handlers: VectorTileHandler[]): VectorFeature[] {
		const features: VectorFeature[] = [];

		for (const handler of handlers) {
			features.push(...handler.getFeatures());
		}

		return features;
	}
}
