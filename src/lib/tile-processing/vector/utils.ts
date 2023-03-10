import {Tags} from "~/lib/tile-processing/vector/providers/OverpassDataObject";

export function assertTags(tags?: Tags): Tags {
	return tags ?? {};
}

export function cleanupTags(tags?: Tags): Tags {
	tags = assertTags(tags);

	for (const [key, value] of Object.entries(tags)) {
		tags[key] = value.trim();
	}

	return tags;
}
