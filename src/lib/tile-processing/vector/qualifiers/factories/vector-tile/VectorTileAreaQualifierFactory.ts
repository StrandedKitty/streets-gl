import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {OMBBResult} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";
import getPitchType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getPitchType";
import getBuildingParams from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getBuildingParams";
import getTreeType from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/helpers/getTreeType";
import Vec3 from "~/lib/math/Vec3";

export default class VectorTileAreaQualifierFactory extends AbstractQualifierFactory<VectorAreaDescriptor, VectorTile.FeatureTags> {
	private static isTagsContainOMBB(tags: VectorTile.FeatureTags): boolean {
		return tags['@ombb00'] !== undefined;
	}

	private static getOMBB(tags: VectorTile.FeatureTags): OMBBResult {
		if (!this.isTagsContainOMBB(tags)) {
			return null;
		}

		return [
			new Vec2(<number>tags['@ombb00'], <number>tags['@ombb01']),
			new Vec2(<number>tags['@ombb10'], <number>tags['@ombb11']),
			new Vec2(<number>tags['@ombb20'], <number>tags['@ombb21']),
			new Vec2(<number>tags['@ombb30'], <number>tags['@ombb31'])
		];
	}

	private static isTagsContainPOI(tags: VectorTile.FeatureTags): boolean {
		return tags['@poiX'] !== undefined;
	}


	private static getPOI(tags: VectorTile.FeatureTags): Vec3 {
		return new Vec3(<number>tags['@poiX'], <number>tags['@poiY'], <number>tags['@poiR']);
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

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'building',
					...getBuildingParams(tags),
					ombb: VectorTileAreaQualifierFactory.getOMBB(tags)
				}
			}];
		}

		if (tags.type === 'path') {
			if (tags.pathType === 'pedestrian' || tags.pathType === 'footway') {
				return [{
					type: QualifierType.Descriptor,
					data: {
						type: 'pavement'
					}
				}];
			}

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'asphalt'
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
					type: 'forest',
					treeType: getTreeType(tags)
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
					pitchType: getPitchType(<string>tags.sport, <number>tags.hoops),
					ombb: VectorTileAreaQualifierFactory.getOMBB(tags)
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
					type: 'farmland',
					ombb: VectorTileAreaQualifierFactory.getOMBB(tags)
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
					type: 'construction',
					poi: VectorTileAreaQualifierFactory.getPOI(tags)
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

		if (tags.type === 'pier') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pavement'
				}
			}];
		}

		return null;
	}
}
