import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import isUnderground from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isUnderground";
import getBuildingParamsFromTags
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getBuildingParamsFromTags";
import getPitchTypeFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getPitchTypeFromTags";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {OMBBResult} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";

export default class VectorTileAreaQualifierFactory extends AbstractQualifierFactory<VectorAreaDescriptor, VectorTile.FeatureTags> {
	private static getOMBB(tags: VectorTile.FeatureTags): OMBBResult {
		return [
			new Vec2(<number>tags['@ombb00'], <number>tags['@ombb01']),
			new Vec2(<number>tags['@ombb10'], <number>tags['@ombb11']),
			new Vec2(<number>tags['@ombb20'], <number>tags['@ombb21']),
			new Vec2(<number>tags['@ombb30'], <number>tags['@ombb31'])
		];
	}

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

			if (tags.levels === undefined) {
				tags.levels = tags.height === undefined ? 1 : Math.round(<number>tags.height / 4);
			}

			if (tags.height === undefined) {
				tags.height = <number>tags.levels * 4;
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'building',
					label: null,
					buildingLevels: <number>tags.levels,
					buildingHeight: <number>tags.height,
					buildingMinHeight: <number>tags.minHeight ?? 0,
					buildingRoofHeight: <number>tags.roofHeight ?? 0,
					buildingRoofType: "flat",
					buildingRoofOrientation: null,
					buildingRoofDirection: <number>tags.roofDirection,
					buildingRoofAngle: <number>tags.roofAngle,
					buildingFacadeMaterial: "plaster",
					buildingFacadeColor: 0xffffff,
					buildingRoofMaterial: 'default',
					buildingRoofColor: 0xffffff,
					buildingWindows: tags.noWindows !== true,
					buildingFoundation: false,
					ombb: VectorTileAreaQualifierFactory.getOMBB(tags)
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

		if (tags.type === 'pitch') {
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

		if (tags.type === 'farmland') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'farmland'
				}
			}];
		}

		if (tags.type === 'scrub') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'shrubbery'
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

		if (tags.type === 'bridge' || tags.type === 'apron') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pavement'
				}
			}];
		}

		if (tags.type === 'helipad') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'helipad'
				}
			}];
		}

		return null;
	}
}
