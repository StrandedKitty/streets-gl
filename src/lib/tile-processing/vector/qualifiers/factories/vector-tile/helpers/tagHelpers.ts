export function getTagValues(tagValue: string): string[] {
	if (tagValue === undefined || tagValue.length === 0) {
		return [];
	}

	return tagValue.split(';').map((part) => part.trim().toLowerCase());
}