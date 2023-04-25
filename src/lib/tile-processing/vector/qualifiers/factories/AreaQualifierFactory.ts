import AbstractQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AbstractQualifierFactory";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Qualifier, QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import isUnderground from "~/lib/tile-processing/vector/qualifiers/factories/helpers/isUnderground";
import getBuildingParamsFromTags
	from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getBuildingParamsFromTags";
import getPitchTypeFromTags from "~/lib/tile-processing/vector/qualifiers/factories/helpers/getPitchTypeFromTags";

export default class AreaQualifierFactory extends AbstractQualifierFactory<VectorAreaDescriptor> {
	public fromTags(tags: Record<string, string>): Qualifier<VectorAreaDescriptor>[] {
		if (isUnderground(tags)) {
			return null;
		}

		if (tags['building:part'] && tags['building:part'] !== 'no') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'buildingPart',
					...getBuildingParamsFromTags(tags, tags['building:part'] === 'roof'),
				}
			}];
		}

		if (tags.building && tags.building !== 'construction') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'building',
					...getBuildingParamsFromTags(tags, tags.building === 'roof')
				}
			}];
		}

		if (tags.natural === 'sand' || tags.natural === 'beach') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'sand'
				}
			}];
		}

		if (tags.natural === 'rock' || tags.natural === 'bare_rock') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'rock'
				}
			}];
		}

		if (tags.leisure === 'pitch') {
			const type = getPitchTypeFromTags(tags);

			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pitch',
					pitchType: type
				}
			}];
		}

		if (tags.leisure === 'playground' || tags.leisure === 'dog_park') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pitch',
					pitchType: 'generic'
				}
			}];
		}

		if (tags.golf === 'fairway') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'manicuredGrass'
				}
			}];
		}

		if (tags.leisure === 'garden') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'garden'
				}
			}];
		}

		if (tags.landuse === 'grass') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'grass'
				}
			}];
		}

		if (tags.landuse === 'construction') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'construction'
				}
			}];
		}

		if (tags.building === 'construction') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'buildingConstruction'
				}
			}];
		}

		if (
			tags.amenity === 'parking' && (tags.parking === 'surface' || tags.parking === undefined) ||
			tags.amenity === 'bicycle_parking'
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'asphalt'
				}
			}];
		}

		if (
			(tags.area === 'yes' || tags.type === 'multipolygon') &&
			(
				tags.highway === 'pedestrian' ||
				tags.highway === 'footway' ||
				tags.man_made === 'pier'
			)
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pavement'
				}
			}];
		}

		if (tags.man_made === 'bridge') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pavement'
				}
			}];
		}

		if (tags.aeroway === 'apron') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'pavement'
				}
			}];
		}

		if (tags.aeroway === 'helipad') {
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