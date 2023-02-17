import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import Handler from "~/lib/tile-processing/vector/handlers/Handler";
import {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";

type Ring = [number, number][];

export default class MapboxAreaHandler implements Handler {
	private readonly rings: VectorAreaRing[] = [];
	private readonly descriptor: VectorAreaDescriptor;

	public constructor(descriptor: VectorAreaDescriptor) {
		this.descriptor = descriptor;
	}

	public addRing(ring: Ring): void {
		if (!MapboxAreaHandler.validateRing(ring)) {
			throw new Error();
		}

		const isClockwise = MapboxAreaHandler.isRingClockwise(ring);
		const type = isClockwise ? VectorAreaRingType.Outer : VectorAreaRingType.Inner;
		const nodes: VectorNode[] = ring.map(([x, y]) => {
			return {
				type: 'node',
				x,
				y,
				osmReference: null,
				descriptor: null
			};
		})

		this.rings.push({type, nodes});
	}

	public getFeatures(): VectorArea[] {
		return [{
			type: 'area',
			rings: this.rings,
			osmReference: {id: 0, type: OSMReferenceType.None},
			descriptor: this.descriptor
		}];
	}

	public getStructuralFeature(): VectorArea {
		return null;
	}

	public preventFeatureOutput(): void {

	}

	private static isRingClockwise(ring: Ring): boolean {
		let sum = 0;

		for (let i = 0; i < ring.length; i++) {
			const point1 = ring[i];
			const point2 = ring[i + 1] ?? ring[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return sum < 0;
	}

	private static validateRing(ring: Ring): boolean {
		const first = ring[0];
		const last = ring[ring.length - 1];

		return first[0] === last[0] && first[1] === last[1];
	}
}