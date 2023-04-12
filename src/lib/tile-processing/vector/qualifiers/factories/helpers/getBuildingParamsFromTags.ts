import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import getRoofOrientationFromOSMOrientation
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofOrientationFromOSMOrientation";
import {
	parseColor,
	parseHeight,
	readTagAsFloat,
	readTagAsUnsignedFloat,
	readTagAsUnsignedInt
} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";
import getDefaultLevelsFromRoofType
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getDefaultLevelsFromRoofType";
import getFacadeMaterialFromOSMMaterial
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getFacadeMaterialFromOSMMaterial";
import isBuildingHasWindows from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isBuildingHasWindows";
import getRoofParamsFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofParamsFromTags";

export default function getBuildingParamsFromTags(
	tags: Record<string, string>,
	onlyRoof: boolean = false
): {
	label: string;
	buildingLevels: number;
	buildingHeight: number;
	buildingMinHeight: number;
	buildingRoofHeight: number;
	buildingRoofType: VectorAreaDescriptor['buildingRoofType'];
	buildingRoofOrientation: VectorAreaDescriptor['buildingRoofOrientation'];
	buildingRoofDirection: number;
	buildingRoofAngle: number;
	buildingFacadeMaterial: VectorAreaDescriptor['buildingFacadeMaterial'];
	buildingFacadeColor: number;
	buildingRoofMaterial: VectorAreaDescriptor['buildingRoofMaterial'];
	buildingRoofColor: number;
	buildingWindows: boolean;
} {
	const fallbackLevels = 1;
	const levelHeight = 4;
	const fallbackFacadeColor = 0xffffff;

	const roofParams = getRoofParamsFromTags(tags);
	const roofOrientation = getRoofOrientationFromOSMOrientation(tags['roof:orientation']);
	const roofLevels = readTagAsUnsignedInt(tags, 'roof:levels') ?? getDefaultLevelsFromRoofType(roofParams.type);
	const roofDirection = readTagAsFloat(tags, 'roof:direction') ?? 0;

	const roofHeight = parseHeight(tags['roof:height'], roofLevels * levelHeight);
	const roofAngle = readTagAsUnsignedFloat(tags, 'roof:angle');

	let minLevel = readTagAsUnsignedInt(tags, 'building:min_level') ?? null;
	let height = parseHeight(tags.height, parseHeight(tags.est_height, null));
	let levels = readTagAsUnsignedInt(tags, 'building:levels') ?? null;
	let minHeight = parseHeight(tags.min_height, null);

	if (height === null && levels === null) {
		levels = fallbackLevels;
		height = levels * levelHeight + roofHeight
	} else if (height === null) {
		height = levels * levelHeight + roofHeight
	} else if (levels === null) {
		levels = Math.max(1, Math.round((height - roofHeight) / levelHeight));
	}

	if (minLevel === null) {
		if (minHeight !== null) {
			minLevel = Math.min(levels - 1, Math.round(minHeight / levelHeight));
		} else {
			minLevel = 0;
		}
	}

	if (minHeight === null) {
		minHeight = Math.min(minLevel * levelHeight, height);
	}

	const color = parseColor(tags['building:colour'], fallbackFacadeColor);
	const material = getFacadeMaterialFromOSMMaterial(tags['building:material'], 'plaster');
	const windows = isBuildingHasWindows(tags);
	const label = tags.name ?? null;

	return {
		label: label,
		buildingLevels: levels - minLevel,
		buildingHeight: height,
		buildingMinHeight: onlyRoof ? (height - roofHeight) : minHeight,
		buildingRoofHeight: roofHeight,
		buildingRoofType: roofParams.type,
		buildingRoofOrientation: roofOrientation,
		buildingRoofDirection: roofDirection,
		buildingRoofAngle: roofAngle,
		buildingFacadeMaterial: material,
		buildingFacadeColor: color,
		buildingRoofMaterial: roofParams.material,
		buildingRoofColor: roofParams.color,
		buildingWindows: windows
	};
}