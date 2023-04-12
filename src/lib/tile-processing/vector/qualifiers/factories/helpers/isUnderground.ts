import {readTagAsUnsignedFloat} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

export default function isUnderground(tags: Record<string, string>): boolean {
	return (
		tags.location === 'underground' ||
		readTagAsUnsignedFloat(tags, 'level') < 0 ||
		tags.tunnel === 'yes' ||
		tags.parking === 'underground'
	);
}