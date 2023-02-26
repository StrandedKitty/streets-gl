import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import earcut from "earcut";
import SkeletonBuilder, {Skeleton} from "straight-skeleton";
import AABB2D from "~/lib/math/AABB2D";
import Vec2 from "~/lib/math/Vec2";
import * as OMBB from "~/lib/math/OMBB";

interface EarcutInput {
	vertices: number[];
	holes: number[];
}

type OMBBResult = [Vec2, Vec2, Vec2, Vec2];

export default class Tile3DMultipolygon {
	public readonly rings: Tile3DRing[] = [];

	private cachedStraightSkeleton: Skeleton = null;
	private cachedOMBB: OMBBResult = null;

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

	private getOMBBInput(): OMBB.Vector[] {
		const vectors: OMBB.Vector[] = [];

		for (const ring of this.rings) {
			if (ring.type === Tile3DRingType.Outer) {
				vectors.push(...ring.nodes.map(v => new OMBB.Vector(v.x, v.y)));
			}
		}

		return vectors;
	}

	public getOMBB(): OMBBResult {
		if (!this.cachedOMBB) {
			const points = this.getOMBBInput();
			const convexHull = OMBB.CalcConvexHull(points);
			const ombb = OMBB.ComputeOMBB(convexHull);

			this.cachedOMBB = [
				new Vec2(ombb[0].x, ombb[0].y),
				new Vec2(ombb[1].x, ombb[1].y),
				new Vec2(ombb[2].x, ombb[2].y),
				new Vec2(ombb[3].x, ombb[3].y)
			];
		}

		return this.cachedOMBB;
	}
}