import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import isUnderground from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isUnderground";
import {
	parseHeight,
	parseMeters,
	readTagAsUnsignedInt
} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";
import getPathParamsFromTags
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getPathParamsFromTags";
import getSidewalkSideFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getSidewalkSideFromTags";
import getCyclewaySideFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getCyclwaySideFromTags";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import getTreeTypeFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getTreeTypeFromTags";
import getFenceMaterialFromOSMType
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getFenceMaterialFromOSMType";
import getWallTypeAndHeight from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getWallTypeAndHeight";
import getRailwayParamsFromTags
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getRailwayParamsFromTags";

export default class PolylineQualifierFactory extends AbstractQualifierFactory<VectorPolylineDescriptor> {
	public fromTags(tags: Record<string, string>): Qualifier<VectorPolylineDescriptor>[] {
		if (isUnderground(tags)) {
			return null;
		}

		if (tags.highway) {
			const params = getPathParamsFromTags(tags);

			if (!params) {
				return [];
			}

			const descriptor: VectorPolylineDescriptor = {
				type: 'path',
				pathMaterial: params.material
			};

			switch (params.type) {
				case 'roadway': {
					descriptor.pathType = 'roadway';

					const isOneWay = tags.oneway === 'yes';
					let lanesForward = readTagAsUnsignedInt(tags, 'lanes:forward');
					let lanesBackward = readTagAsUnsignedInt(tags, 'lanes:backward');
					const lanesTotal = readTagAsUnsignedInt(tags, 'lanes') ?? params.defaultLanes;

					if (isOneWay) {
						lanesForward = lanesTotal;
						lanesBackward = 0;
					} else {
						if (lanesForward === undefined && lanesBackward === undefined) {
							lanesForward = Math.ceil(lanesTotal / 2);
							lanesBackward = lanesTotal - lanesForward;
						} else if (lanesForward === undefined) {
							lanesForward = Math.max(0, lanesTotal - lanesBackward);
						} else if (lanesBackward === undefined) {
							lanesBackward = Math.max(0, lanesTotal - lanesForward);
						}
					}

					descriptor.lanesForward = lanesForward;
					descriptor.lanesBackward = lanesBackward;

					const parsedWidth = parseMeters(tags.width);

					if (parsedWidth === undefined && params.defaultWidth !== undefined) {
						descriptor.width = params.defaultWidth;
					} else {
						descriptor.width = (lanesForward + lanesBackward) * 3;
					}
					break;
				}
				case 'footway': {
					descriptor.pathType = 'footway';
					descriptor.width = parseMeters(tags.width) ?? 2;
					break;
				}
				case 'cycleway': {
					descriptor.pathType = 'cycleway';
					descriptor.width = parseMeters(tags.width) ?? 3;
					break;
				}
			}

			const qualifiers: Qualifier<VectorPolylineDescriptor>[] = [{
				type: QualifierType.Descriptor,
				data: descriptor
			}];

			if (descriptor.pathType === 'roadway') {
				const cyclewayWidth = 2;
				const sidewalkWidth = 2;

				const sidewalkSide = getSidewalkSideFromTags(tags);
				const cyclewaySide = getCyclewaySideFromTags(tags);

				const roadWidth = descriptor.width;

				if (cyclewaySide) {
					qualifiers.push({
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'cycleway',
							width: roadWidth + cyclewayWidth * 2,
							side: cyclewaySide
						}
					});
				}

				if (sidewalkSide) {
					if (!cyclewaySide || cyclewaySide === 'both') {
						qualifiers.push({
							type: QualifierType.Descriptor,
							data: {
								type: 'path',
								pathType: 'footway',
								width: roadWidth + sidewalkWidth * 2 + (cyclewaySide === 'both' ? cyclewayWidth * 2 : 0),
								side: sidewalkSide
							}
						});
					} else {
						if (sidewalkSide === 'left' || sidewalkSide === 'both') {
							const multiplier = cyclewaySide === 'left' ? 1 : 0;
							const width = roadWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

							qualifiers.push({
								type: QualifierType.Descriptor,
								data: {
									type: 'path',
									pathType: 'footway',
									width: width,
									side: 'left'
								}
							});
						}

						if (sidewalkSide === 'right' || sidewalkSide === 'both') {
							const multiplier = cyclewaySide === 'right' ? 1 : 0;
							const width = roadWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

							qualifiers.push({
								type: QualifierType.Descriptor,
								data: {
									type: 'path',
									pathType: 'footway',
									width: width,
									side: 'right'
								}
							});
						}
					}
				}
			}

			return qualifiers;
		}

		if (tags.aeroway === 'runway' || tags.aeroway === 'taxiway') {
			let width = parseMeters(tags.width);

			if (width === undefined) {
				if (tags.aeroway === 'runway') {
					width = 45;
				} else {
					width = 20;
				}
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'path',
					pathType: 'runway',
					width: width
				}
			}];
		}

		if (
			tags.railway === 'rail' ||
			tags.railway === 'light_rail' ||
			tags.railway === 'subway' ||
			tags.railway === 'disused' ||
			tags.railway === 'narrow_gauge' ||
			tags.railway === 'tram'
		) {
			const {type, width} = getRailwayParamsFromTags(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'path',
					pathType: type,
					width: width
				}
			}];
		}

		if (tags.barrier === 'fence') {
			const fenceParams = getFenceMaterialFromOSMType(tags.fence_type);
			const minHeight = parseHeight(tags.min_height, 0);
			const height = parseHeight(tags.height, fenceParams.defaultHeight) - minHeight;

			if (height <= 0) {
				return [];
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'fence',
					fenceMaterial: fenceParams.material,
					height,
					minHeight
				}
			}];
		}

		if (tags.barrier === 'hedge') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'wall',
					wallType: 'hedge',
					height: parseHeight(tags.height, 1),
				}
			}];
		}

		if (tags.barrier === 'wall') {
			const {material, height} = getWallTypeAndHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'wall',
					wallType: material,
					height: height
				}
			}];
		}

		if (tags.power === 'line' || tags.power === 'minor_line') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'powerLine'
				}
			}];
		}

		if (tags.natural === 'tree_row') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.NodeRow,
					spacing: 10,
					randomness: 1,
					descriptor: {
						type: 'tree',
						height: parseHeight(tags.height, undefined),
						treeType: getTreeTypeFromTags(tags)
					}
				}
			}];
		}

		return null;
	}
}