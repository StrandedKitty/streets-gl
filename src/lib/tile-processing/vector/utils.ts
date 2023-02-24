import {Tags} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import MathUtils from "~/lib/math/MathUtils";

export function assertTags(tags?: Tags): Tags {
	return tags ?? {};
}

export function cleanupTags(tags?: Tags): Tags {
	tags = assertTags(tags);

	for (const [key, value] of Object.entries(tags)) {
		tags[key] = value.trim();
	}

	return tags;
}

export function applyScaleToFeatures(collection: VectorFeatureCollection, x: number, y: number, zoom: number): void {
	const {lat} = MathUtils.tile2degrees(x, y, zoom);
	const scale = MathUtils.mercatorScaleFactor(lat);

	for (const area of collection.areas) {
		area.descriptor.buildingHeight *= scale;
		area.descriptor.buildingMinHeight *= scale;
		area.descriptor.buildingRoofHeight *= scale;
	}
}