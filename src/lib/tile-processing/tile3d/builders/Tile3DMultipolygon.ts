import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import earcut from "earcut";
import SkeletonBuilder, {Skeleton} from "straight-skeleton";
import AABB2D from "~/lib/math/AABB2D";

interface EarcutInput {
	vertices: number[];
	holes: number[];
}

export default class Tile3DMultipolygon {
	public readonly rings: Tile3DRing[] = [];

	private cachedStraightSkeleton: Skeleton = null;

	public constructor() {

	}

	public addRing(ring: Tile3DRing): void {
		this.rings.push(ring);
	}

	public getFootprint(
		{
			height,
			flip
		}: {
			height: number;
			flip: boolean;
		}
	): {
		positions: number[];
		uvs: number[];
		normals: number[];
	} {
		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];
		const normalY = flip ? -1 : 1;

		for (const ring of this.rings) {
			if (ring.type !== Tile3DRingType.Outer) {
				continue;
			}

			const {vertices, holes} = this.getRingEarcutInput(
				ring,
				this.rings.filter(ring => ring.type === Tile3DRingType.Inner)
			);
			const triangles = earcut(vertices, holes);

			if (!flip) {
				triangles.reverse();
			}

			for (let i = 0; i < triangles.length; i++) {
				positions.push(
					vertices[triangles[i] * 2],
					height,
					vertices[triangles[i] * 2 + 1]
				);
				uvs.push(vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]);
				normals.push(0, normalY, 0);
			}
		}

		return {
			positions,
			uvs,
			normals
		};
	}

	private getRingEarcutInput(outerRing: Tile3DRing, innerRings: Tile3DRing[]): EarcutInput {
		let vertices: number[] = [...outerRing.getFlattenVertices()];
		const holes: number[] = [];

		for (const inner of innerRings) {
			holes.push(vertices.length / 2);
			vertices = vertices.concat(inner.getFlattenVertices());
		}

		return {vertices, holes};
	}

	public getStraightSkeleton(): Skeleton {
		if (!this.cachedStraightSkeleton) {
			const inputRings = this.getStraightSkeletonInput();

			if (inputRings.length === 0) {
				return null;
			}

			let skeleton: Skeleton = null;

			try {
				skeleton = SkeletonBuilder.BuildFromGeoJSON(inputRings);
			} catch (e) {
				//console.error(e);
			}

			this.cachedStraightSkeleton = skeleton;
		}

		return this.cachedStraightSkeleton;
	}

	private getStraightSkeletonInput(): [number, number][][][] {
		const outerRing = this.rings.find(ring => ring.type === Tile3DRingType.Outer);
		const innerRings = this.rings.filter(ring => ring.type === Tile3DRingType.Inner);

		if (!outerRing) {
			return [];
		}

		const rings = [outerRing.getGeoJSONVertices().slice(1)];

		for (const innerRing of innerRings) {
			rings.push(innerRing.getGeoJSONVertices().slice(1));
		}

		return [rings];
	}

	public getAABB(): AABB2D {
		const aabb = new AABB2D();

		for (const ring of this.rings) {
			aabb.includeAABB(ring.getAABB());
		}

		return aabb;
	}
}