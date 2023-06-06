import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<string, VectorAreaDescriptor['buildingRoofMaterial']> = {
	tile: 'tiles',
	tiles: 'tiles',
	roof_tiles: 'tiles',
	slate: 'tiles',
	metal: 'metal',
	metal_sheet: 'metal',
	'metal sheet': 'metal',
	tin: 'metal',
	copper: 'metal',
	zinc: 'metal',
	concrete: 'concrete',
	asphalt: 'concrete',
	eternit: 'eternit',
	asbestos: 'eternit',
	thatch: 'thatch',
	grass: 'grass',
	glass: 'glass',
	tar_paper: 'tar'
};

export default function getRoofMaterial(
	material: string,
	fallback: VectorAreaDescriptor['buildingRoofMaterial'] = 'concrete'
): VectorAreaDescriptor['buildingRoofMaterial'] {
	return lookup[material] ?? fallback;
}