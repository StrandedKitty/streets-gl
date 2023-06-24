import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

const lookup: Record<string, {
	type: VectorPolylineDescriptor['wallType'];
	defaultHeight: number;
}> = {
	hedge: {
		type: 'hedge',
		defaultHeight: 1
	},
	dry_stone: {
		type: 'stone',
		defaultHeight: 3
	},
	stone: {
		type: 'stone',
		defaultHeight: 3
	},
	brick: {
		type: 'stone',
		defaultHeight: 3
	},
	concrete: {
		type: 'concrete',
		defaultHeight: 3
	},
	concrete_block: {
		type: 'concrete',
		defaultHeight: 3
	},
};

export default function getWallParams(tags: VectorTile.FeatureTags): {
	material: VectorPolylineDescriptor['wallType'];
	height: number;
	minHeight: number;
} {
	const wallTagValue = <string>tags.wallType;
	const entry = lookup[wallTagValue] ?? lookup.concrete;

	return {
		material: entry.type,
		height: <number>tags.height ?? entry.defaultHeight,
		minHeight: <number>tags.minHeight
	};
}