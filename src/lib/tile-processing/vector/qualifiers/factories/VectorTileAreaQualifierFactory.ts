import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import isUnderground from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isUnderground";
import getBuildingParamsFromTags
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getBuildingParamsFromTags";
import getPitchTypeFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getPitchTypeFromTags";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default class VectorTileAreaQualifierFactory extends AbstractQualifierFactory<VectorAreaDescriptor, VectorTile.FeatureTags> {
	public fromTags(tags: VectorTile.FeatureTags): Qualifier<VectorAreaDescriptor>[] {
		if (tags.type === 'building') {
			if (tags.buildingType === 'construction') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'buildingConstruction'
					}
				}];
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'building',
					label: null,
					buildingLevels: 1,
					buildingHeight: 10,
					buildingMinHeight: 0,
					buildingRoofHeight: 0,
					buildingRoofType: "flat",
					buildingRoofOrientation: null,
					buildingRoofDirection: 0,
					buildingRoofAngle: 0,
					buildingFacadeMaterial: "plaster",
					buildingFacadeColor: 0xffffff,
					buildingRoofMaterial: 'default',
					buildingRoofColor: 0xffffff,
					buildingWindows: true,
					buildingFoundation: false
				}
			}];
		}

		if (tags.type === 'water') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'water'
				}
			}];
		}

		if (tags.type === 'forest') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'forest'
				}
			}];
		}

		if (tags.type === 'sand') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'sand'
				}
			}];
		}

		if (tags.type === 'rock') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'rock'
				}
			}];
		}

		if (tags.type === 'playground' || tags.type === 'dogPark') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pitch',
					pitchType: 'generic'
				}
			}];
		}

		if (tags.type === 'fairway') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'manicuredGrass'
				}
			}];
		}

		if (tags.type === 'garden') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'garden'
				}
			}];
		}

		if (tags.type === 'grass') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'grass'
				}
			}];
		}

		if (tags.type === 'construction' || tags.type === 'brownfield') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'construction'
				}
			}];
		}

		if (tags.type === 'parking') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'asphalt'
				}
			}];
		}

		return null;
	}
}
