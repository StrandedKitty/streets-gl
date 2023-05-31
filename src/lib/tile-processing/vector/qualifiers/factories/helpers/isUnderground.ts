import {readTagAsFloat} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

export default function isUnderground(tags: Record<string, string>): boolean {
	const isInTunnel = tags.tunnel !== undefined && tags.tunnel !== 'no';

	return (
		tags.location === 'underground' ||
		readTagAsFloat(tags, 'level') < 0 ||
		isInTunnel ||
		tags.parking === 'underground'
	);
}