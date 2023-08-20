import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import getRoofType from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/helpers/getRoofType";
import isBuildingSupportsDefaultRoof
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/isBuildingSupportsDefaultRoof";
import getRoofMaterial from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getRoofMaterial";
import parseColor from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/helpers/parseColor";

export default function getRoofParams(tags: VectorTile.FeatureTags): {
	type: VectorAreaDescriptor['buildingRoofType'];
	material: VectorAreaDescriptor['buildingRoofMaterial'];
	color: number;
} {
	const type = getRoofType(<string>tags.roofShape, 'flat');
	//const noDefault = !isBuildingSupportsDefaultRoof(tags) || type !== 'flat';
	const noDefault = false;

	const materialTagValue = <string>tags.roofMaterial;
	const colorTagValue = parseColor(<string>tags.roofColor);

	let material = getRoofMaterial(materialTagValue, 'default');
	let color = colorTagValue ?? null;

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

	return {
		type: type,
		material: material,
		color: color
	};
}
