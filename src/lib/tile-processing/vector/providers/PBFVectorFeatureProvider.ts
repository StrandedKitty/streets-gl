import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import Pbf from 'pbf';
import {FeatureProvider} from "~/lib/tile-processing/types";
import PBFTile from "~/lib/tile-processing/vector/providers/pbf/PBFTile";
import PBFTileDecoder, {TagTypes, TagTypesMap} from "~/lib/tile-processing/vector/providers/pbf/PBFTileDecoder";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import VectorTilePolygonHandler from "~/lib/tile-processing/vector/handlers/VectorTilePolygonHandler";
import VectorTileLineStringHandler from "~/lib/tile-processing/vector/handlers/VectorTileLineStringHandler";
import VectorTilePointHandler from "~/lib/tile-processing/vector/handlers/VectorTilePointHandler";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {getCollectionFromVectorFeatures} from "~/lib/tile-processing/vector/utils";

const proto = require('./pbf/vector_tile.js').Tile;

const PBFTagTypesMap: TagTypesMap = {
	"@ombb00": TagTypes.Double,
	"@ombb01": TagTypes.Double,
	"@ombb10": TagTypes.Double,
	"@ombb11": TagTypes.Double,
	"@ombb20": TagTypes.Double,
	"@ombb21": TagTypes.Double,
	"@ombb30": TagTypes.Double,
	"@ombb31": TagTypes.Double,
	type: TagTypes.String,
	osmId: TagTypes.SInt,
	osmType: TagTypes.SInt,
	name: TagTypes.String,
	width: TagTypes.Double,
	height: TagTypes.Double,
	minHeight: TagTypes.Double,
	roofHeight: TagTypes.Double,
	buildingType: TagTypes.String,
	wallType: TagTypes.String,
	pathType: TagTypes.String,
	cyclewaySide: TagTypes.SInt,
	sidewalkSide: TagTypes.SInt,
	surface: TagTypes.String,
	lanes: TagTypes.SInt,
	lanesForward: TagTypes.SInt,
	lanesBackward: TagTypes.SInt,
	oneway: TagTypes.Bool,
	levels: TagTypes.SInt,
	roofLevels: TagTypes.SInt,
	roofShape: TagTypes.String,
	windows: TagTypes.Bool,
	defaultRoof: TagTypes.Bool,
	color: TagTypes.SInt,
	material: TagTypes.String,
	roofMaterial: TagTypes.String,
	roofColor: TagTypes.SInt,
	roofType: TagTypes.String,
	roofAngle: TagTypes.Double,
	roofOrientation: TagTypes.String,
	roofDirection: TagTypes.Double,
	laneMarkings: TagTypes.String,
	gauge: TagTypes.Double,
	fenceType: TagTypes.String,
	leafType: TagTypes.String,
	genus: TagTypes.String,
	direction: TagTypes.Double,
	waterwayType: TagTypes.String,
	sport: TagTypes.String,
	hoops: TagTypes.SInt,
	railwayType: TagTypes.String,
	crop: TagTypes.String,
} as const;

export default class PBFVectorFeatureProvider implements FeatureProvider<VectorFeatureCollection> {
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
		const vectorTile = await PBFVectorFeatureProvider.fetchTile(x, y, zoom);

		const handlers = PBFVectorFeatureProvider.getVectorTileHandlers(vectorTile);
		const features = PBFVectorFeatureProvider.getFeaturesFromHandlers(handlers);

		return getCollectionFromVectorFeatures(features);
	}

	private static async fetchTile(x: number, y: number, zoom: number): Promise<VectorTile.Tile> {
		const size = 40075016.68 / (1 << zoom);
		const url = PBFVectorFeatureProvider.getTileURL(x, y, zoom);
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
		return `http://localhost:8083/data/test/${zoom}/${x}/${y}.pbf`
	}

	private static getVectorTileHandlers(vectorTile: VectorTile.Tile): VectorTileHandler[] {
		const handlers: VectorTileHandler[] = [];

		for (const layer of vectorTile.layers.values()) {
			for (const feature of layer.features) {
				switch (feature.type) {
					case VectorTile.FeatureType.Polygon: {
						handlers.push(new VectorTilePolygonHandler(feature));
						break;
					}
					case VectorTile.FeatureType.LineString: {
						handlers.push(new VectorTileLineStringHandler(feature));
						break;
					}
					case VectorTile.FeatureType.Point: {
						handlers.push(new VectorTilePointHandler(feature));
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