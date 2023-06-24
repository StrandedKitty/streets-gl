import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

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

export default function isBuildingHasWindows(tags: VectorTile.FeatureTags): boolean {
	const windowsValue = <boolean>tags.windows;

	if (windowsValue !== undefined) {
		return windowsValue;
	}

	return !buildingsWithoutWindows.includes(<string>tags.buildingType);
}
