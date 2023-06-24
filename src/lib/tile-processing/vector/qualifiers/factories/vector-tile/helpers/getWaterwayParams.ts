import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

const lookup: Record<string, number> = {
	river: 10,
	stream: 2,
	canal: 8,
	drain: 1,
	ditch: 1,
};

export default function getWaterwayParams(tags: VectorTile.FeatureTags): {
	width: number;
} {
	const defaultWidth = lookup[<string>tags.waterwayType];

	if (defaultWidth === undefined) {
		return null;
	}

	return {
		width: <number>tags.width ?? defaultWidth
	};
}