export default interface PBFTile {
	layers: PBFLayer[];
}

export interface PBFLayer {
	version: number;
	name: string;
	features: PBFFeature[];
	keys: PBFTagKey[];
	values: PBFTagValue[];
	extent: number;
}

export interface PBFFeature {
	id: number;
	tags: number[];
	type: number;
	geometry: number[];
}

export type PBFTagKey = string;

export interface PBFTagValue {
	string_value: string;
	float_value: number;
	double_value: number;
	int_value: number;
	uint_value: number;
	sint_value: number;
	bool_value: boolean;
}
