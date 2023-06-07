import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {getOSMReferenceFromVectorTileFeatureTags} from "~/lib/tile-processing/vector/utils";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import VectorTilePolylineQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/vector-tile/VectorTilePolylineQualifierFactory";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import Ring from "~/lib/tile-processing/vector/handlers/Ring";
import {VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";

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