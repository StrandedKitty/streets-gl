import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor, VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import {parseHeight, parseMeters} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

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

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'path',
					width: 6,
					pathType: 'roadway',
					pathMaterial: 'asphalt',
					lanesForward: 2,
					lanesBackward: 2,
					isRoadwayMarked: true
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
						height: +tags.height ?? undefined,
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
