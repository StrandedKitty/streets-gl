import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<string, VectorAreaDescriptor['buildingFacadeMaterial']> = {
	brick: 'brick',
	cement_block: 'cementBlock',
	block: 'cementBlock',
	wood: 'wood',
	plaster: 'plaster',
	plastered: 'plaster',
	concrete: 'plaster',
	hard: 'plaster',
	glass: 'glass',
	mirror: 'glass'
};

export default function getFacadeMaterialFromOSMMaterial(
	material: string,
	fallback: VectorAreaDescriptor['buildingFacadeMaterial'] = 'plaster'
): VectorAreaDescriptor['buildingFacadeMaterial'] {
	return lookup[material] ?? fallback;
}