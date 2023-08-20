import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import getBuildingParams from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/helpers/getBuildingParams";
import getTreeType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getTreeType";

export default class OnegeoAreaQualifierFactory extends AbstractQualifierFactory<VectorAreaDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags, layer: string): Qualifier<VectorAreaDescriptor>[] {
		if (layer === 'building') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'building',
					...getBuildingParams(tags)
				}
			}];
		}

		if (layer === 'landcover') {
			if (tags.class === 'grass') {
				if (tags.subclass === 'grass') {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'grass'
						}
					}];
				}
				if (tags.subclass === 'garden') {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'garden'
						}
					}];
				}
				if (tags.subclass === 'scrub') {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'shrubbery'
						}
					}];
				}
			}
			if (tags.class === 'rock') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'rock'
					}
				}];
			}
			if (tags.class === 'wood') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'forest',
						treeType: 'genericBroadleaved'
					}
				}];
			}
			if (tags.class === 'sand') {
				if (tags.subclass === 'sand' || tags.subclass === 'beach') {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'sand'
						}
					}];
				}
			}
		}

		if (layer === 'landuse') {
			if (tags.class === 'pitch' || tags.class === 'playground') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'pitch',
						pitchType: 'generic'
					}
				}];
			}
		}

		if (layer === 'transportation') {
			if (tags.class === 'bridge') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'pavement'
					}
				}];
			}
			if (tags.class === 'path') {
				if (tags.subclass === 'pedestrian' || tags.subclass === 'footway') {
					return [{
						type: QualifierType.Descriptor,
						data: {
							type: 'pavement'
						}
					}];
				}
			}
			if (tags.class === 'pier') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'pavement'
					}
				}];
			}
		}

		if (layer === 'water') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'water'
				}
			}];
		}

		return null;
	}
}
