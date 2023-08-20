import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default class OnegeoNodeQualifierFactory extends AbstractQualifierFactory<VectorNodeDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags, layer: string): Qualifier<VectorNodeDescriptor>[] {
		if (layer === 'poi') {
			if (tags.subclass === "bus_stop") {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'busStop'
					}
				}];
			}
		}

		return null;
	}
}
