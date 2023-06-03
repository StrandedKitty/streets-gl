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
	width: TagTypes.Double,
	height: TagTypes.Double,
	minHeight: TagTypes.Double,
	roofHeight: TagTypes.Double,
	buildingType: TagTypes.String,
	wallType: TagTypes.String,
	pathType: TagTypes.String,
	cyclewaySide: TagTypes.String,
	sidewalkSide: TagTypes.String,
	surface: TagTypes.String,
	lanesForward: TagTypes.SInt,
	lanesBackward: TagTypes.SInt,
	isOneway: TagTypes.Bool,
	levels: TagTypes.SInt,
	roofLevels: TagTypes.SInt,
	roofShape: TagTypes.String,
	noWindows: TagTypes.Bool,
	color: TagTypes.SInt,
	roofColor: TagTypes.SInt,
	roofType: TagTypes.String,
	roofMaterial: TagTypes.String,
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
	pitchType: TagTypes.String,
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

		/*const pointLayer = vectorTile.layers.get('point');

		if (pointLayer) {
			for (const feature of pointLayer.features) {
				if (feature.type === VectorTile.FeatureType.Point) {
					nodes.push({
						type: 'node',
						osmReference: {
							type: OSMReferenceType.Node,
							id: 1
						},
						descriptor: {
							type: "tree",
							height: feature.tags.height as number
						},
						x: feature.geometry[0][0],
						y: feature.geometry[0][1],
						rotation: 0
					});
				}
			}
		}

		const highwayLayer = vectorTile.layers.get('highways');

		if (highwayLayer) {
			for (const feature of highwayLayer.features) {
				if (feature.type === VectorTile.FeatureType.LineString) {
					for (const line of feature.geometry) {
						polylines.push({
							type: 'polyline',
							osmReference: {
								type: OSMReferenceType.Node,
								id: 1
							},
							descriptor: {
								type: "path",
								pathMaterial: "asphalt",
								pathType: "roadway",
								width: 5,
								lanesForward: 1,
								lanesBackward: 1,
								isRoadwayMarked: true,
							},
							nodes: line.map((point) => {
								return {
									type: 'node',
									osmReference: {
										type: OSMReferenceType.Node,
										id: 1
									},
									descriptor: {
										type: "tree",
										height: feature.tags.height as number
									},
									x: point[0],
									y: point[1],
									rotation: 0
								};
							})
						});
					}
				}
			}
		}

		const buildingLayer = vectorTile.layers.get('buildings');

		if (buildingLayer) {
			for (const feature of buildingLayer.features) {
				if (feature.type !== VectorTile.FeatureType.Polygon) {
					continue;
				}

				const desc: VectorAreaDescriptor = {
					type: "building",
					label: null,
					buildingLevels: 1,
					buildingHeight: 10,
					buildingMinHeight: 0,
					buildingRoofHeight: 0,
					buildingRoofType: "flat",
					buildingRoofOrientation: null,
					buildingRoofDirection: 0,
					buildingRoofAngle: 0,
					buildingFacadeMaterial: "plaster",
					buildingFacadeColor: 0xffffff,
					buildingRoofMaterial: 'default',
					buildingRoofColor: 0xffffff,
					buildingWindows: true,
					buildingFoundation: false
				};

				const handler = new MapboxAreaHandler(desc);

				for (const ring of feature.geometry) {
					handler.addRing(ring.map((point) => {
						return [
							point[0],
							point[1]
						];
					}));
				}

				const features = handler.getFeatures();
				const ref: OSMReference = {
					type: feature.tags.osmType === 1 ? OSMReferenceType.Way : OSMReferenceType.Relation,
					id: feature.tags.osmId as number
				};

				for (const feature of features) {
					feature.osmReference = ref;
				}

				areas.push(...features);
			}
		}

		return {
			nodes,
			polylines,
			areas
		};*/
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