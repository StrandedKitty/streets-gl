import OnegeoHandler from "~/lib/tile-processing/vector/handlers/OnegeoHandler";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import getOSMReferenceFromOnegeoID from "~/lib/tile-processing/vector/handlers/getOSMReferenceFromOnegeoID";
import VectorTilePolylineQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/VectorTilePolylineQualifierFactory";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import Ring from "~/lib/tile-processing/vector/handlers/Ring";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OnegeoPolylineQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/OnegeoPolylineQualifierFactory";

export default class OnegeoLineStringHandler implements OnegeoHandler {
	private readonly tags: VectorTile.FeatureTags;
	private readonly layer: string;
	private readonly osmReference: OSMReference;
	private readonly geometry: VectorTile.LineStringGeometry;

	public constructor(feature: VectorTile.LineStringFeature, layer: string) {
		this.tags = feature.tags;
		this.layer = layer;
		this.osmReference = getOSMReferenceFromOnegeoID(<string>this.tags.id);
		this.geometry = feature.geometry;
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new OnegeoPolylineQualifierFactory().fromTags(this.tags, this.layer);

		if (!qualifiers) {
			return features;
		}

		for (const qualifier of qualifiers) {
			if (qualifier.type === QualifierType.Descriptor) {
				for (let i = 0; i < this.geometry.length; i++) {
					features.push(this.getVectorPolylineFromGeometry(i, qualifier.data));
				}
			} else if (qualifier.type === QualifierType.Modifier) {
				const modifier = qualifier.data;

				if (modifier.type === ModifierType.NodeRow) {
					for (let i = 0; i < this.geometry.length; i++) {
						const ring = new Ring(
							this.getVectorNodesFromGeometry(i),
							VectorAreaRingType.Outer
						);

						const nodes = ring.distributeNodes(modifier.spacing, modifier.randomness, modifier.descriptor);

						features.push(...nodes);
					}
				} else {
					console.error(`Unexpected modifier ${modifier.type}`);
				}
				break;
			}
		}

		return features;
	}

	private getVectorPolylineFromGeometry(
		geometryIndex: number,
		descriptor: VectorPolylineDescriptor
	): VectorPolyline {
		const nodes = this.getVectorNodesFromGeometry(geometryIndex);

		return {
			type: 'polyline',
			osmReference: this.osmReference,
			descriptor: {...descriptor},
			nodes: nodes
		};
	}

	private getVectorNodesFromGeometry(geometryIndex: number): VectorNode[] {
		const points = this.geometry[geometryIndex];

		return points.map(([x, y]) => {
			return {
				type: 'node',
				x,
				y,
				rotation: 0,
				osmReference: null,
				descriptor: null
			};
		});
	}
}
