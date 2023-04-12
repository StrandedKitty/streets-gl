import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<string, VectorPolylineDescriptor['pathMaterial']> = {
	asphalt: 'asphalt',
	concrete: 'concrete',
	wood: 'wood',
	paving_stones: 'cobblestone',
	sett: 'cobblestone',
	cobblestone: 'cobblestone',
	pebblestone: 'cobblestone',
	rock: 'cobblestone',
	stone: 'cobblestone',
};

export default function getPathMaterialFromOSMMaterial(
	material: string,
	fallback: VectorPolylineDescriptor['pathMaterial'] = 'asphalt'
): VectorPolylineDescriptor['pathMaterial'] {
	return lookup[material] ?? fallback;
}