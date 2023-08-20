import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<string, VectorAreaDescriptor['buildingRoofType']> = {
	flat: 'flat',
	hipped: 'hipped',
	gabled: 'gabled',
	gambrel: 'gambrel',
	pyramid: 'pyramidal',
	onion: 'onion',
	dome: 'dome',
	round: 'round',
	skillion: 'skillion',
	mansard: 'mansard',
	quadruple_saltbox: 'quadrupleSaltbox',
	saltbox: 'saltbox',
};

export default function getRoofType(
	shape: string,
	fallback: VectorAreaDescriptor['buildingRoofType'] = 'flat'
): VectorAreaDescriptor['buildingRoofType'] {
	return lookup[shape] ?? fallback;
}
