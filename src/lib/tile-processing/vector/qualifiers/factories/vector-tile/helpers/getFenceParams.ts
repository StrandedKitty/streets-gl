import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

const lookup: Record<string, {
	type: VectorPolylineDescriptor['fenceMaterial'];
	defaultHeight: number;
}> = {
	wood: {
		type: 'wood',
		defaultHeight: 2
	},
	chain_link: {
		type: 'chainLink',
		defaultHeight: 3
	},
	wire: {
		type: 'chainLink',
		defaultHeight: 3
	},
	metal: {
		type: 'metal',
		defaultHeight: 1.5
	},
	railing: {
		type: 'metal',
		defaultHeight: 1.5
	},
	concrete: {
		type: 'concrete',
		defaultHeight: 2.5
	}
};

export default function getFenceParams(tags: VectorTile.FeatureTags): {
	material: VectorPolylineDescriptor['fenceMaterial'];
	height: number;
	minHeight: number;
} {
	const type = <string>tags.fenceType;
	const entry = lookup[type] ?? lookup.metal;

	return {
		material: entry.type,
		height: <number>tags.height ?? entry.defaultHeight,
		minHeight: <number>tags.minHeight
	};
}