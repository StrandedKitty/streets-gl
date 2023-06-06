import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import getPathParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathParams";
import getPathLanes from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathLanes";
import getPathWidth from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPathWidth";

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
					const width = getPathWidth(tags, lanes.forward, lanes.backward, params.defaultWidth);
					const isMarked = <boolean>tags.laneMarkings ?? params.defaultIsMarked;

					qualifiers.push({
						type: QualifierType.Descriptor,
						data: {
							type: 'path',
							pathType: 'roadway',
							pathMaterial: params.material,
							lanesForward: lanes.forward,
							lanesBackward: lanes.backward,
							width: width,
							isRoadwayMarked: isMarked
						}
					});

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
						treeType: 'genericBroadleaved'
					}
				}
			}];
		}

		if (tags.type === 'waterway') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'waterway',
					width: 10
				}
			}];
		}

		if (tags.type === 'wall') {
			if (tags.wallType === 'hedge') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'wall',
						wallType: 'hedge',
						height: <number>tags.height ?? 1,
						minHeight: <number>tags.minHeight ?? undefined
					}
				}];
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'wall',
					wallType: 'stone',
					height: <number>tags.height ?? 3,
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}

		if (tags.type === 'fence') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'fence',
					fenceMaterial: 'wood',
					height: <number>tags.height ?? 3,
					minHeight: <number>tags.minHeight ?? undefined
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
