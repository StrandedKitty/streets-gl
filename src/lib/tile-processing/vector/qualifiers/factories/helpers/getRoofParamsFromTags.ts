import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import getRoofTypeFromOSMRoofShape
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofTypeFromOSMRoofShape";
import getRoofMaterialFromOSMMaterial
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofMaterialFromOSMMaterial";
import {parseColor} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

export default function getRoofParamsFromTags(tags: Record<string, string>): {
	type: VectorAreaDescriptor['buildingRoofType'];
	material: VectorAreaDescriptor['buildingRoofMaterial'];
	color: number;
} {
	const type = getRoofTypeFromOSMRoofShape(tags['roof:shape'], 'flat');
	const noDefault = tags.building === 'stadium'
		|| tags.building === 'houseboat'
		|| type !== 'flat'
		|| !!tags['bridge:support']
		|| !!tags['ship:type']
		|| tags.man_made === 'storage_tank'
		|| tags.man_made === 'chimney'

	const materialTagValue = tags['roof:material'];
	const colorTagValue = tags['roof:colour'];

	let material = getRoofMaterialFromOSMMaterial(materialTagValue, 'default');
	let color = parseColor(colorTagValue, null);

	if ((color !== null || noDefault) && material === 'default') {
		material = 'concrete';
	}

	if (color === null) {
		switch (material) {
			case 'concrete': {
				color = 0xBBBBBB;
				break;
			}
			case 'metal': {
				color = materialTagValue === 'copper' ? 0xA3CABD : 0xC3D2DD;
				break;
			}
			case 'tiles': {
				color = materialTagValue === 'slate' ? 0x8C8C97 : 0xCB7D64;
				break;
			}
			default: {
				color = 0xffffff;
			}
		}
	}

	if (material === 'thatch' || material === 'eternit' || material === 'grass') {
		color = 0xffffff;
	}

	return {
		type: type,
		material: material,
		color: color
	};
}