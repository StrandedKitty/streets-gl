import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default function getSidewalkSideFromTags(tags: Record<string, string>): VectorPolylineDescriptor['side'] {
	const isBoth = tags['sidewalk:both'] === 'yes' || tags['sidewalk'] === 'both';
	const isOnLeft = tags['sidewalk:left'] === 'yes' || tags['sidewalk'] === 'left' || isBoth;
	const isOnRight = tags['sidewalk:right'] === 'yes' || tags['sidewalk'] === 'right' || isBoth;

	if (isOnLeft && isOnRight) {
		return 'both';
	}

	if (isOnLeft) {
		return 'left';
	}

	if (isOnRight) {
		return 'right';
	}

	return null;
}