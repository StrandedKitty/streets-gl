import OnegeoHandler from "~/lib/tile-processing/vector/handlers/OnegeoHandler";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import getOSMReferenceFromOnegeoID from "~/lib/tile-processing/vector/handlers/getOSMReferenceFromOnegeoID";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import OnegeoNodeQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/OnegeoNodeQualifierFactory";

export default class OnegeoPointHandler implements OnegeoHandler {
	private readonly x: number;
	private readonly y: number;
	private readonly tags: VectorTile.FeatureTags;
	private readonly layer: string;
	private readonly osmReference: OSMReference;

	public constructor(feature: VectorTile.PointFeature, layer: string) {
		this.tags = feature.tags;
		this.layer = layer;
		this.osmReference = getOSMReferenceFromOnegeoID(<string>this.tags.id);

		this.x = feature.geometry[0][0];
		this.y = feature.geometry[0][1];
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new OnegeoNodeQualifierFactory().fromTags(this.tags, this.layer);

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
