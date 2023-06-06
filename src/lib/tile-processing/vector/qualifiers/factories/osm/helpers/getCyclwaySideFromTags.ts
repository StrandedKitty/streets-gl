import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default function getCyclewaySideFromTags(tags: Record<string, string>): VectorPolylineDescriptor['side'] {
	const isBoth = tags['cycleway:both'] === 'lane';
	const isOnLeft = tags['cycleway:left'] === 'lane' || isBoth;
	const isOnRight = tags['cycleway:right'] === 'lane' || isBoth;

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