import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const lookup: Record<string, [VectorPolylineDescriptor['fenceMaterial'], number]> = {
	wood: ['wood', 2],
	chain_link: ['chainLink', 3],
	wire: ['chainLink', 3],
	metal: ['metal', 1.5],
	railing: ['metal', 1.5],
	concrete: ['concrete', 2.5],
};

export default function getFenceMaterialFromOSMType(
	type: string
): {
	material: VectorPolylineDescriptor['fenceMaterial'];
	defaultHeight: number;
} {
	const entry = lookup[type] ?? lookup.metal;

	return {
		material: entry[0],
		defaultHeight: entry[1],
	};
}