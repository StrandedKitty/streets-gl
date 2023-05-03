const buildingsWithoutWindows: string[] = [
	'garage',
	'garages',
	'greenhouse',
	'storage_tank',
	'bunker',
	'silo',
	'stadium',
	'ship',
	'castle',
	'service',
	'digester',
	'water_tower',
	'shed'
];

export default function isBuildingHasWindows(tags: Record<string, string>): boolean {
	if (tags.window === 'yes') {
		return true;
	}

	if (tags.window === 'no') {
		return false;
	}

	if (
		tags['bridge:support'] ||
		tags.man_made === 'storage_tank' ||
		tags.man_made === 'chimney' ||
		tags.man_made === 'stele'
	) {
		return false;
	}

	return !buildingsWithoutWindows.includes(tags.building);
}