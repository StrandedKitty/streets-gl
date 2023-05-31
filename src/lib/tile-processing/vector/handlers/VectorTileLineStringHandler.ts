import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {getOSMReferenceFromVectorTileFeatureTags} from "~/lib/tile-processing/vector/utils";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import VectorTilePolylineQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/VectorTilePolylineQualifierFactory";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";

export default class VectorTileLineStringHandler implements VectorTileHandler {
	private readonly tags: VectorTile.FeatureTags;
	private readonly osmReference: OSMReference;
	private readonly geometry: VectorTile.LineStringGeometry;

	public constructor(feature: VectorTile.LineStringFeature) {
		this.tags = feature.tags;
		this.osmReference = getOSMReferenceFromVectorTileFeatureTags(this.tags);
		this.geometry = feature.geometry;
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new VectorTilePolylineQualifierFactory().fromTags(this.tags);

		if (!qualifiers) {
			return features;
		}

		for (const qualifier of qualifiers) {
			if (qualifier.type === QualifierType.Descriptor) {
				for (let i = 0; i < this.geometry.length; i++) {
					features.push(this.getVectorPolylineFromGeometry(i, qualifier.data));
				}
			} else if (qualifier.type === QualifierType.Modifier) {

			}
		}

		return features;
	}

	private getVectorPolylineFromGeometry(
		geometryIndex: number,
		descriptor: VectorPolylineDescriptor
	): VectorPolyline {
		const points = this.geometry[geometryIndex];
		const nodes: VectorNode[] = points.map(([x, y]) => {
			return {
				type: 'node',
				x,
				y,
				rotation: 0,
				osmReference: null,
				descriptor: null
			};
		});

		return {
			type: 'polyline',
			osmReference: this.osmReference,
			descriptor: descriptor,
			nodes: nodes
		};
	}
}