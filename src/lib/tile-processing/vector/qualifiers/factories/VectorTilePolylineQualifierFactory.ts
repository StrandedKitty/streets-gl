import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor, VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";

export default class VectorTilePolylineQualifierFactory extends AbstractQualifierFactory<VectorPolylineDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorPolylineDescriptor>[] {
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
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'wall',
					wallType: 'stone',
					height: 4
				}
			}];
		}

		return null;
	}
}
