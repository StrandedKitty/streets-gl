import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import getPathParams from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/helpers/getPathParams";
import getPathLanes from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathLanes";
import getPathWidth from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathWidth";
import getRoadExtensionSide
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getRoadExtensionSide";

export default class OnegeoPolylineQualifierFactory extends AbstractQualifierFactory<VectorPolylineDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags, layer: string): Qualifier<VectorPolylineDescriptor>[] {
		if (layer === 'waterway') {
			if (tags.class === 'canal') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'waterway',
						width: 8
					}
				}];
			}
		}

		if (layer === 'transportation') {
			if (tags.class === 'rail' && tags.subclass === 'rail') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'path',
						pathType: 'railway',
						width: 1.435
					}
				}];
			}

			const params = getPathParams(tags);

			if (params) {
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
								width: <number>tags.width ?? params.defaultWidth ?? 2
							}
						}];
					}
					case 'cycleway': {
						return [{
							type: QualifierType.Descriptor,
							data: {
								type: 'path',
								pathType: 'cycleway',
								width: <number>tags.width ?? params.defaultWidth ?? 3
							}
						}];
					}
				}
			}
		}

		return null;
	}
}
