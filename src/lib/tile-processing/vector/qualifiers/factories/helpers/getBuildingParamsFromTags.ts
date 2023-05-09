import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import getRoofOrientationFromOSMOrientation
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofOrientationFromOSMOrientation";
import {
	parseDirection,
	parseHeight,
	readTagAsUnsignedFloat,
	readTagAsUnsignedInt
} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";
import getDefaultLevelsFromRoofType
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getDefaultLevelsFromRoofType";
import getFacadeParamsFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getFacadeParamsFromTags";
import isBuildingHasWindows from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isBuildingHasWindows";
import getRoofParamsFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRoofParamsFromTags";
import MathUtils from "~/lib/math/MathUtils";

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
	buildingFoundation: boolean;
} {
	const fallbackLevels = 1;
	const levelHeight = 4;

	const hasFoundation = !onlyRoof &&
		tags['building:levels'] === undefined &&
		tags['building:min_level'] === undefined &&
		tags.height === undefined &&
		tags.est_height === undefined &&
		tags.min_height === undefined;

	const roofParams = getRoofParamsFromTags(tags);
	const roofOrientation = getRoofOrientationFromOSMOrientation(tags['roof:orientation']);
	const roofLevels = readTagAsUnsignedInt(tags, 'roof:levels') ?? getDefaultLevelsFromRoofType(roofParams.type);
	const roofDirection = parseDirection(tags['roof:direction'], 0);
	const roofAngle = readTagAsUnsignedFloat(tags, 'roof:angle');
	let roofHeight = parseHeight(tags['roof:height'], roofLevels * levelHeight);

	let minLevel = readTagAsUnsignedInt(tags, 'building:min_level') ?? null;
	let height = parseHeight(tags.height, parseHeight(tags.est_height, null));
	let levels = readTagAsUnsignedInt(tags, 'building:levels') ?? null;
	let minHeight = parseHeight(tags.min_height, null);

	if (height !== null) {
		roofHeight = Math.min(roofHeight, height - (minHeight ?? 0));
	}

	if (height === null && levels === null) {
		levels = (minLevel !== null) ? minLevel: fallbackLevels;
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

	const facadeParams = getFacadeParamsFromTags(tags);
	const label = tags.name ?? null;

	let windows = isBuildingHasWindows(tags);
	if (height - minHeight - roofHeight < 2) {
		windows = false;
	}

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
		buildingFacadeMaterial: facadeParams.material,
		buildingFacadeColor: facadeParams.color,
		buildingRoofMaterial: roofParams.material,
		buildingRoofColor: roofParams.color,
		buildingWindows: windows,
		buildingFoundation: hasFoundation
	};
}