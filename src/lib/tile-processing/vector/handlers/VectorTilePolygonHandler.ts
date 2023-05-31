import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";
import VectorTileHandler from "~/lib/tile-processing/vector/handlers/VectorTileHandler";
import {getOSMReferenceFromVectorTileFeatureTags} from "~/lib/tile-processing/vector/utils";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import VectorTileAreaQualifierFactory
	from "~/lib/tile-processing/vector/qualifiers/factories/VectorTileAreaQualifierFactory";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";

export default class VectorTilePolygonHandler implements VectorTileHandler {
	private readonly rings: VectorAreaRing[] = [];
	private readonly tags: VectorTile.FeatureTags;
	private readonly osmReference: OSMReference;

	public constructor(feature: VectorTile.PolygonFeature) {
		this.tags = feature.tags;
		this.osmReference = getOSMReferenceFromVectorTileFeatureTags(this.tags);

		for (const ring of feature.geometry) {
			this.addRing(ring);
		}
	}

	public addRing(ring: VectorTile.PolygonRingGeometry): void {
		if (!VectorTilePolygonHandler.validateRing(ring)) {
			throw new Error('Invalid PBF ring');
		}

		const vectorRing = VectorTilePolygonHandler.inputRingToVectorRing(ring);

		this.rings.push(vectorRing);
	}

	public getFeatures(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new VectorTileAreaQualifierFactory().fromTags(this.tags);

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
					descriptor: descriptor
				});
			} else {
				if (!areas[areas.length - 1]) {
					throw new Error('Invalid ring order');
				}

				areas[areas.length - 1].rings.push(ring);
			}
		}

		return areas;
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

	private static validateRing(ring: VectorTile.PolygonRingGeometry): boolean {
		const first = ring[0];
		const last = ring[ring.length - 1];

		return first[0] === last[0] && first[1] === last[1];
	}

	private static inputRingToVectorRing(ring: VectorTile.PolygonRingGeometry): VectorAreaRing {
		const isClockwise = VectorTilePolygonHandler.isRingClockwise(ring);
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
}