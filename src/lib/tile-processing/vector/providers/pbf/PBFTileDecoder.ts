import PBFTile, {PBFFeature, PBFTagKey, PBFTagValue} from "~/lib/tile-processing/vector/providers/pbf/PBFTile";
import PBFGeometryParser from "~/lib/tile-processing/vector/providers/pbf/PBFGeometryParser";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export enum TagTypes {
	String,
	Float,
	Double,
	Int,
	UInt,
	SInt,
	Bool
}

export type TagTypesMap = Record<string, TagTypes>;

export default class PBFTileDecoder {
	public static decode(
		tile: PBFTile,
		tagTypes: TagTypesMap,
		tileSize: number
	): VectorTile.Tile {
		const decodedLayers: Map<string, VectorTile.Layer> = new Map();

		for (const layer of tile.layers) {
			const decodedLayer: VectorTile.Layer = {
				features: []
			};
			const keys = layer.keys;
			const values = layer.values;

			for (const feature of layer.features) {
				const decodedFeature = this.decodeFeature(
					feature,
					keys,
					values,
					tagTypes,
					layer.extent,
					tileSize
				);

				decodedLayer.features.push(decodedFeature);
			}

			decodedLayers.set(layer.name, decodedLayer);
		}

		return {
			layers: decodedLayers
		};
	}

	private static decodeFeature(
		feature: PBFFeature,
		keys: PBFTagKey[],
		values: PBFTagValue[],
		tagTypes: TagTypesMap,
		extent: number,
		tileSize: number
	): VectorTile.Feature {
		switch (feature.type) {
			case 1: {
				return {
					id: feature.id,
					type: VectorTile.FeatureType.Point,
					tags: this.decodeTags(feature.tags, keys, values, tagTypes),
					geometry: PBFGeometryParser.convertCommandsToPoints(feature.geometry, extent, tileSize)
				};
			}
			case 2: {
				return {
					id: feature.id,
					type: VectorTile.FeatureType.LineString,
					tags: this.decodeTags(feature.tags, keys, values, tagTypes),
					geometry: PBFGeometryParser.convertCommandsToLineString(feature.geometry, extent, tileSize)
				};
			}
			case 3: {
				return {
					id: feature.id,
					type: VectorTile.FeatureType.Polygon,
					tags: this.decodeTags(feature.tags, keys, values, tagTypes),
					geometry: PBFGeometryParser.convertCommandsToPolygon(feature.geometry, extent, tileSize)
				};
			}
		}

		throw new Error(`Unknown feature type: ${feature.type}`);
	}

	private static decodeTags(
		tags: number[],
		keys: PBFTagKey[],
		values: PBFTagValue[],
		tagTypes: TagTypesMap
	): VectorTile.FeatureTags {
		const decodedTags: VectorTile.FeatureTags = {};

		for (let i = 0; i < tags.length; i += 2) {
			const key = keys[tags[i]];
			const value = values[tags[i + 1]];
			const tagType = tagTypes[key];

			if (tagType === undefined) {
				console.warn(`Unknown tag key: ${key}`, value);
				continue;
			}

			decodedTags[key] = this.decodeTagValue(value, tagType);
		}

		return decodedTags; 
	}

	private static decodeTagValue(value: PBFTagValue, type: TagTypes): string | number | boolean {
		switch (type) {
			case TagTypes.String:
				return value.string_value;
			case TagTypes.Float:
				return value.float_value;
			case TagTypes.Double:
				return value.double_value;
			case TagTypes.Int:
				return value.int_value;
			case TagTypes.UInt:
				return value.uint_value;
			case TagTypes.SInt:
				return value.sint_value;
			case TagTypes.Bool:
				return value.bool_value;
		}

		throw new Error(`Unknown tag type: ${type}`);
	}
}