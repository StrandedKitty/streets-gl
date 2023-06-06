import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default function getPathWidth(
	tags: VectorTile.FeatureTags,
	lanesForward: number,
	lanesBackward: number,
	defaultWidth: number
): number {
	const widthTag = <number>tags.width;

	if (widthTag !== undefined) {
		return widthTag;
	}

	if (defaultWidth !== undefined) {
		return defaultWidth;
	}

	const lanes = lanesForward + lanesBackward;

	if (lanes === 1) {
		return 4;
	}

	return lanes * 3;
}