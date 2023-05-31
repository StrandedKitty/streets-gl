import {Tags} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";

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


export function getCollectionFromVectorFeatures(features: VectorFeature[]): VectorFeatureCollection {
	const collection: VectorFeatureCollection = {
		nodes: [],
		polylines: [],
		areas: [],
	};

	for (const feature of features) {
		switch (feature.type) {
			case "node":
				collection.nodes.push(feature);
				break;
			case "polyline":
				collection.polylines.push(feature);
				break;
			case "area":
				collection.areas.push(feature);
				break;
		}
	}

	return collection;
}

export function getOSMReferenceFromVectorTileFeatureTags(tags: VectorTile.FeatureTags): OSMReference {
	const ref: OSMReference = {
		type: OSMReferenceType.None,
		id: 0
	};

	switch (tags.osmType) {
		case 0:
			ref.type = OSMReferenceType.Node;
			break;
		case 1:
			ref.type = OSMReferenceType.Way;
			break;
		case 2:
			ref.type = OSMReferenceType.Relation;
			break;
	}

	if (tags.osmId !== undefined) {
		ref.id = <number>tags.osmId;
	}

	return ref;
}