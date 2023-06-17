import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default function getFeatureHeightAndMinHeight(tags: VectorTile.FeatureTags): [number, number] {
	const minHeight = <number>tags.minHeight ?? 0;
	let height = <number>tags.height ?? undefined;

	if (height !== undefined && minHeight !== 0) {
		height -= minHeight;
		height = Math.max(height, 0);
	}

	return [height, minHeight];
}