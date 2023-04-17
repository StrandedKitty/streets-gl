export default function isBuildingHasWindows(tags: Record<string, string>): boolean {
	if (tags['bridge:support'] || tags.man_made === 'storage_tank' || tags.man_made === 'chimney' || tags.man_made === 'stele') {
		return false;
	}

	const list = ['garage', 'garages', 'greenhouse', 'storage_tank', 'bunker', 'silo', 'stadium', 'ship'];

	return !list.includes(tags.building);
}