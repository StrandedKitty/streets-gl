import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import getTreeType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getTreeType";

export default class VectorTileNodeQualifierFactory extends AbstractQualifierFactory<VectorNodeDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorNodeDescriptor>[] {
		if (tags.type === 'tree') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'tree',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined,
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
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'memorial',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'statue') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'statue',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'sculpture') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'sculpture',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined,
					direction: <number>tags.direction ?? undefined
				}
			}];
		}

		if (tags.type === 'windTurbine') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'windTurbine',
					height: <number>tags.height ?? undefined,
					minHeight: <number>tags.minHeight ?? undefined
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
