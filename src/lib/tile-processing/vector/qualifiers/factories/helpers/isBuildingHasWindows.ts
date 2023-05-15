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
	'shed',
	'ger',
	'barn',
	'slurry_tank',
	'container',
	'carport'
];

export default function isBuildingHasWindows(tags: Record<string, string>): boolean {
	if (tags.window === 'no' || tags.windows === 'no') {
		return false;
	}	
	
	if (tags.window === 'yes' || tags.windows === 'yes') {
		return true;
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
