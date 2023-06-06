import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {getTagValues} from "~/lib/tile-processing/vector/qualifiers/factories/osm/helpers/tagHelpers";

const lookup: Record<string, VectorAreaDescriptor['pitchType']> = {
	soccer: 'football',
	tennis: 'tennis',
	basketball: 'basketball'
}

export default function getPitchType(
	sport: string,
	hoops: number
): VectorAreaDescriptor['pitchType'] {
	const type = lookup[sport];

	if (type === 'basketball' && hoops === 1) {
		return 'generic';
	}

	return type ?? 'generic';
}