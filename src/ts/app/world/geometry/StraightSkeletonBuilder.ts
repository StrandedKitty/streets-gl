import Way3D from "./features/3d/Way3D";
import Ring3D, {RingType} from "./features/3d/Ring3D";
import SkeletonBuilder, {Skeleton} from "straight-skeleton";

export default class StraightSkeletonBuilder {
	private static RandomOffsetScale = 0.5;

	public static buildFromWay(way: Way3D): Skeleton {
		const inputRings = this.getInputDataFromWay(way);

		if (inputRings.length === 0) {
			return null;
		}

		let skeleton = null;

		try {
			skeleton = SkeletonBuilder.BuildFromGeoJSON(inputRings);
		} catch {}

		return skeleton;
	}

	private static getInputDataFromWay(way: Way3D): [number, number][][][] {
		const outerRings = way.rings.filter(ring => ring.type === RingType.Outer);
		const innerRings = way.rings.filter(ring => ring.type === RingType.Inner);

		if (outerRings.length === 0) {
			return [];
		}

		const resultRings = [this.cloneRingVertices(outerRings[0])];

		for (const ring of innerRings) {
			resultRings.push(this.cloneRingVertices(ring));
		}

		for (const ring of resultRings) {
			this.applyRandomOffsetToRingVertices(ring);
		}

		return [resultRings];
	}

	private static cloneRingVertices(ring: Ring3D): [number, number][] {
		const copy: [number, number][] = new Array(ring.vertices.length - 1);

		for (let i = 0; i < ring.vertices.length - 1; i++) {
			copy[i] = ring.vertices[i].slice() as [number, number];
		}

		return copy;
	}

	private static applyRandomOffsetToRingVertices(vertices: [number, number][]): void {
		for (let i = 0; i < vertices.length; i++) {
			vertices[i][0] += (Math.random() - 0.5) * this.RandomOffsetScale;
			//vertices[i][1] += (Math.random() - 0.5) * this.RandomOffsetScale;
		}
	}
}