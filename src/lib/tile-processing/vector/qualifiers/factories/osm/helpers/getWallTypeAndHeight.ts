import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {parseHeight} from "~/lib/tile-processing/vector/qualifiers/factories/osm/helpers/tagHelpers";

const lookup: Record<string, [VectorPolylineDescriptor['wallType'], number]> = {
	dry_stone: ['stone', 3],
	stone: ['stone', 3],
	brick: ['stone', 3],
	concrete: ['concrete', 3],
	concrete_block: ['concrete', 3],
};

export default function getWallTypeAndHeight(tags: Record<string, string>): {
	material: VectorPolylineDescriptor['wallType'];
	height: number;
} {
	const wallTagValue = tags.wall;
	const entry = lookup[wallTagValue] ?? lookup.concrete;

	const material = entry[0];
	const height = parseHeight(tags.height, entry[1]);

	return {material, height};
}