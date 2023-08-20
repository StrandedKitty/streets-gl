import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import parseColor from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/helpers/parseColor";

const lookup: Record<string, {
	type: VectorAreaDescriptor['buildingFacadeMaterial'];
	defaultColor: number;
}> = {
	brick: {type: 'brick', defaultColor: 0x8c4834},
	cement_block: {type: 'cementBlock', defaultColor: 0xffffff},
	block: {type: 'cementBlock', defaultColor: 0xffffff},
	wood: {type: 'wood', defaultColor: 0xffffff},
	plaster: {type: 'plaster', defaultColor: 0xffffff},
	plastered: {type: 'plaster', defaultColor: 0xffffff},
	concrete: {type: 'plaster', defaultColor: 0xdddddd},
	hard: {type: 'plaster', defaultColor: 0xdddddd},
	glass: {type: 'glass', defaultColor: 0xffffff},
	mirror: {type: 'glass', defaultColor: 0xffffff},
};

export default function getFacadeParamsFromTags(tags: VectorTile.FeatureTags): {
	material: VectorAreaDescriptor['buildingFacadeMaterial'];
	color: number;
} {
	const materialTagValue = <string>tags.material
	const colorTagValue = parseColor(<string>tags.color);

	const config = lookup[materialTagValue] ?? lookup.plaster;
	const color = colorTagValue ?? config.defaultColor;

	return {
		material: config.type,
		color: color
	};
}
