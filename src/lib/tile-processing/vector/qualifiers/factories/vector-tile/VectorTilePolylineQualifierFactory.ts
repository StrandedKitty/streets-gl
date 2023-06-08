import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import getPathParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathParams";
import getPathLanes from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathLanes";
import getPathWidth from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathWidth";
import getTreeType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getTreeType";
import getWaterwayParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getWaterwayParams";
import getRoadExtensionSide
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getRoadExtensionSide";
import getWallParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getWallParams";
import getFenceParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getFenceParams";
import getRailwayParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getRailwayParams";

export default class VectorTilePolylineQualifierFactory extends AbstractQualifierFactory<VectorPolylineDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorPolylineDescriptor>[] {
		if (tags.type === 'path') {
			switch (tags.pathType) {
				case 'runway':
				case 'taxiway': {
					const width = <number>tags.width ?? (tags.pathType === 'runway' ? 45 : 20);

					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'runway',
							width: width
						}
					}];
				}
			}

			const params = getPathParams(tags);

			if (!params) {
				return null;
			}

			switch (params.type) {
				case "roadway": {
					const qualifiers: Qualifier<VectorPolylineDescriptor>[] = [];
					const lanes = getPathLanes(tags, params.defaultLanes);
					const roadwayWidth = getPathWidth(tags, lanes.forward, lanes.backward, params.defaultWidth);
					const isMarked = <boolean>tags.laneMarkings ?? params.defaultIsMarked;

					qualifiers.push({
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'roadway',
							pathMaterial: params.material,
							lanesForward: lanes.forward,
							lanesBackward: lanes.backward,
							width: roadwayWidth,
							isRoadwayMarked: isMarked
						}
					});

					const sidewalkSide = getRoadExtensionSide(<number>tags.sidewalkSide);
					const cyclewaySide = getRoadExtensionSide(<number>tags.cyclewaySide);
					const cyclewayWidth = 2;
					const sidewalkWidth = 2;

					if (cyclewaySide) {
						qualifiers.push({
							type: QualifierType.Descriptor,
							data: {
								type: 'path',
								pathType: 'cycleway',
								width: roadwayWidth + cyclewayWidth * 2,
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
									width: roadwayWidth + sidewalkWidth * 2 + (cyclewaySide === 'both' ? cyclewayWidth * 2 : 0),
									side: sidewalkSide
								}
							});
						} else {
							if (sidewalkSide === 'left' || sidewalkSide === 'both') {
								const multiplier = cyclewaySide === 'left' ? 1 : 0;
								const width = roadwayWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

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
								const width = roadwayWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

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

					return qualifiers;
				}
				case 'footway': {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'footway',
							width: <number>tags.width ?? 2
						}
					}];
				}
				case 'cycleway': {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'cycleway',
							width: <number>tags.width ?? 3
						}
					}];
				}
			}
		}

		if (tags.type === 'railway') {
			const {type, width} = getRailwayParams(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'path',
					pathType: type,
					width: width
				}
			}];
		}

		if (tags.type === 'treeRow') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.NodeRow,
					spacing: 10,
					randomness: 1,
					descriptor: {
						type: 'tree',
						height: <number>tags.height ?? undefined,
						minHeight: <number>tags.minHeight ?? undefined,
						treeType: getTreeType(tags)
					}
				}
			}];
		}

		if (tags.type === 'waterway') {
			const params = getWaterwayParams(tags);

			if (!params) {
				return null;
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'waterway',
					width: params.width,
				}
			}];
		}

		if (tags.type === 'wall') {
			const params = getWallParams(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'wall',
					wallType: params.material,
					height: params.height,
					minHeight: params.minHeight
				}
			}];
		}

		if (tags.type === 'fence') {
			const params = getFenceParams(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'fence',
					fenceMaterial: params.material,
					height: params.height,
					minHeight: params.minHeight
				}
			}];
		}

		if (tags.type === 'powerLine') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'powerLine'
				}
			}];
		}

		return null;
	}
}
