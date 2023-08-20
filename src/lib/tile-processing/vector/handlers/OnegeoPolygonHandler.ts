import OnegeoHandler from "~/lib/tile-processing/vector/handlers/OnegeoHandler";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import OnegeoAreaQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/onegeo/OnegeoAreaQualifierFactory";
import getOSMReferenceFromOnegeoID from "~/lib/tile-processing/vector/handlers/getOSMReferenceFromOnegeoID";

export default class OnegeoPolygonHandler implements OnegeoHandler {
	private readonly rings: VectorAreaRing[] = [];
	private readonly tags: VectorTile.FeatureTags;
	private readonly layer: string;
	private readonly osmReference: OSMReference;

	public constructor(feature: VectorTile.PolygonFeature, layer: string) {
		this.tags = feature.tags;
		this.layer = layer;
		this.osmReference = getOSMReferenceFromOnegeoID(<string>this.tags.partId ?? <string>this.tags.id);

		for (const ring of feature.geometry) {
			this.addRing(ring);
		}
	}

	public addRing(ring: VectorTile.PolygonRingGeometry): void {
		if (!OnegeoPolygonHandler.validateRing(ring)) {
			throw new Error('Invalid PBF ring');
		}

		const vectorRing = OnegeoPolygonHandler.inputRingToVectorRing(ring);

		this.rings.push(vectorRing);
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new OnegeoAreaQualifierFactory().fromTags(this.tags, this.layer);

		if (!qualifiers) {
			return [];
		}

		for (const qualifier of qualifiers) {
			if (qualifier.type === QualifierType.Descriptor) {
				features.push(...this.getVectorAreasFromRings(qualifier.data));
			}
		}

		return features;
	}

	private getVectorAreasFromRings(descriptor: VectorAreaDescriptor): VectorArea[] {
		const areas: VectorArea[] = [];

		for (const ring of this.rings) {
			if (ring.type === VectorAreaRingType.Outer) {
				areas.push({
					type: 'area',
					rings: [ring],
					osmReference: this.osmReference,
					descriptor: {...descriptor}
				});
			} else {
				if (!areas[areas.length - 1]) {
					//console.error('Invalid ring order');
					ring.type = VectorAreaRingType.Outer;
					ring.nodes.reverse();
					areas.push({
						type: 'area',
						rings: [ring],
						osmReference: this.osmReference,
						descriptor: {...descriptor}
					});
					continue;
				}

				areas[areas.length - 1].rings.push(ring);
			}
		}

		return areas;
	}

	private static validateRing(ring: VectorTile.PolygonRingGeometry): boolean {
		const first = ring[0];
		const last = ring[ring.length - 1];

		return first[0] === last[0] && first[1] === last[1];
	}

	private static inputRingToVectorRing(ring: VectorTile.PolygonRingGeometry): VectorAreaRing {
		const isClockwise = this.isRingClockwise(ring);
		const type = isClockwise ? VectorAreaRingType.Outer : VectorAreaRingType.Inner;
		const nodes: VectorNode[] = ring.map(([x, y]) => {
			return {
				type: 'node',
				x,
				y,
				rotation: 0,
				osmReference: null,
				descriptor: null
			};
		});

		return {type, nodes};
	}

	private static isRingClockwise(ring: VectorTile.PolygonRingGeometry): boolean {
		let sum = 0;

		for (let i = 0; i < ring.length; i++) {
			const point1 = ring[i];
			const point2 = ring[i + 1] ?? ring[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return sum < 0;
	}
}
