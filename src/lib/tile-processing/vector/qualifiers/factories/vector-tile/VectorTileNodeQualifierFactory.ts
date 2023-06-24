import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import getTreeType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getTreeType";
import getFeatureHeightAndMinHeight
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getHeightAndMinHeight";

export default class VectorTileNodeQualifierFactory extends AbstractQualifierFactory<VectorNodeDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorNodeDescriptor>[] {
		if (tags.type === 'tree') {
			const [height, minHeight] = getFeatureHeightAndMinHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'tree',
					height: height,
					minHeight: minHeight,
					treeType: getTreeType(tags)
				}
			}];
		}

		if (tags.type === 'fireHydrant') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'hydrant',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}

		if (tags.type === 'adColumn') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'adColumn',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}

		if (tags.type === 'memorial') {
			const [height, minHeight] = getFeatureHeightAndMinHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'memorial',
					height: height,
					minHeight: minHeight,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'statue') {
			const [height, minHeight] = getFeatureHeightAndMinHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'statue',
					height: height,
					minHeight: minHeight,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'sculpture') {
			const [height, minHeight] = getFeatureHeightAndMinHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'sculpture',
					height: height,
					minHeight: minHeight,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'windTurbine') {
			const [height, minHeight] = getFeatureHeightAndMinHeight(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'windTurbine',
					height: height,
					minHeight: minHeight,
				}
			}];
		}

		if (tags.type === 'bench') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'bench',
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'picnicTable') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'picnicTable',
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.highway === 'roundabout') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.CircleArea,
					radius: 10,
					descriptor: {
						type: 'roadwayIntersection',
						intersectionMaterial: 'asphalt'
					}
				}
			}];
		}

		if (tags.type === 'busStop') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'busStop',
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'helipad') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.CircleArea,
					radius: 8,
					descriptor: {
						type: 'helipad'
					}
				}
			}];
		}

		if (tags.type === 'rock') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'rock',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}

		/*if (tags.type === 'utilityPole') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'utilityPole',
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}

		if (tags.type === 'transmissionTower') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'transmissionTower',
					minHeight: <number>tags.minHeight ?? undefined
				}
			}];
		}*/

		return null;
	}
}
