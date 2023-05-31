import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {getOSMReferenceFromVectorTileFeatureTags} from "~/lib/tile-processing/vector/utils";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import VectorTileNodeQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/VectorTileNodeQualifierFactory";

export default class VectorTilePointHandler implements VectorTileHandler {
	private readonly x: number;
	private readonly y: number;
	private readonly tags: VectorTile.FeatureTags;
	private readonly osmReference: OSMReference;

	public constructor(feature: VectorTile.PointFeature) {
		this.tags = feature.tags;
		this.osmReference = getOSMReferenceFromVectorTileFeatureTags(this.tags);

		// MultiPoint is not supported
		this.x = feature.geometry[0][0];
		this.y = feature.geometry[0][1];
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new VectorTileNodeQualifierFactory().fromTags(this.tags);

		if (!qualifiers) {
			return [];
		}

		for (const qualifier of qualifiers) {
			if (qualifier.type === QualifierType.Descriptor) {
				features.push({
					type: 'node',
					x: this.x,
					y: this.y,
					rotation: 0,
					osmReference: this.osmReference,
					descriptor: qualifier.data
				});
			} else if (qualifier.type === QualifierType.Modifier) {

			}
		}

		return features;
	}
}