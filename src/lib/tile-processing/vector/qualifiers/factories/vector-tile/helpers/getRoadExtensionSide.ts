import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default function getRoadExtensionSide(tagValue: number): VectorPolylineDescriptor['side'] {
	switch (tagValue) {
		case 0: return 'left';
		case 1: return 'right';
		case 2: return 'both';
	}

	return null;
}