import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<VectorAreaDescriptor['buildingRoofType'], number> = {
	flat: 0,
	hipped: 1,
	gabled: 1,
	gambrel: 1,
	pyramidal: 1,
	onion: 2,
	dome: 2,
	round: 2,
	skillion: 1,
	mansard: 1,
	quadrupleSaltbox: 1
};

export default function getDefaultLevelsFromRoofType(type: VectorAreaDescriptor['buildingRoofType']): number {
	return lookup[type];
}