import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {getTagValues} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

const lookup: Record<string, VectorAreaDescriptor['pitchType']> = {
	soccer: 'football',
	tennis: 'tennis',
	basketball: 'basketball'
}

export default function getPitchTypeFromTags(tags: Record<string, string>): VectorAreaDescriptor['pitchType'] {
	const values = getTagValues(tags, 'sport');

	for (const value of values) {
		const type = lookup[value];

		if (type === 'basketball' && getTagValues(tags, 'hoops')[0] == '1') {
			return 'generic';
		}

		if (type !== undefined) {
			return type;
		}
	}

	return 'generic';
}