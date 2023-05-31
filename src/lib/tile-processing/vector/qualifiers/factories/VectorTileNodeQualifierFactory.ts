import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default class VectorTileNodeQualifierFactory extends AbstractQualifierFactory<VectorNodeDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorNodeDescriptor>[] {
		if (tags.type === 'tree') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'tree',
					height: <number>tags.height ?? undefined,
					treeType: 'genericBroadleaved'
				}
			}];
		}

		return null;
	}
}
