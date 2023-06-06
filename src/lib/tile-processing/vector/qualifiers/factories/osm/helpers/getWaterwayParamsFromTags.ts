import {parseHeight} from "~/lib/tile-processing/vector/qualifiers/factories/osm/helpers/tagHelpers";

const lookup: Record<string, number> = {
	river: 10,
	stream: 2,
	canal: 8,
	drain: 1,
	ditch: 1,
};

export default function getWaterwayParamsFromTags(tags: Record<string, string>): {
	width: number;
} {
	const defaultWidth = lookup[tags.waterway];

	if (defaultWidth === undefined) {
		return null;
	}

	return {
		width: parseHeight(tags.width, defaultWidth)
	};
}