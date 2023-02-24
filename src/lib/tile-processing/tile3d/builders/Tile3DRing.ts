import Vec2 from "~/lib/math/Vec2";
import * as OMBB from "~/lib/math/OMBB";
import AABB2D from "~/lib/math/AABB2D";

export enum Tile3DRingType {
	Outer,
	Inner
}

type OMBBResult = [Vec2, Vec2, Vec2, Vec2];

export default class Tile3DRing {
	public readonly type: Tile3DRingType;
	public readonly nodes: Vec2[];

	private cachedFlattenVertices: number[] = null;
	private cachedGeoJSONVertices: [number, number][] = null;
	private cachedAABB: AABB2D = null;
	private cachedOMBB: OMBBResult = null;

	public constructor(type: Tile3DRingType, nodes: Vec2[]) {
		this.type = type;
		this.nodes = nodes;
	}

	public getFlattenVertices(): number[] {
		if (!this.cachedFlattenVertices) {
			const vertices: number[] = [];

			for (const node of this.nodes) {
				vertices.push(node.x, node.y);
			}

			this.cachedFlattenVertices = vertices;
		}

		return this.cachedFlattenVertices;
	}

	public getGeoJSONVertices(): [number, number][] {
		if (!this.cachedGeoJSONVertices) {
			const vertices: [number, number][] = [];

			for (const node of this.nodes) {
				vertices.push([node.x, node.y]);
			}

			this.cachedGeoJSONVertices = vertices;
		}

		return this.cachedGeoJSONVertices;
	}

	private getOMBB(): [Vec2, Vec2, Vec2, Vec2] {
		if (!this.cachedOMBB) {
			const vectors: OMBB.Vector[] = this.nodes.map(v => new OMBB.Vector(v.x, v.y));
			const convexHull = OMBB.CalcConvexHull(vectors);
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

	public getAABB(): AABB2D {
		if (!this.cachedAABB) {
			const aabb = new AABB2D();

			for (const node of this.nodes) {
				aabb.includePoint(node);
			}

			this.cachedAABB = aabb;
		}

		return this.cachedAABB;
	}
}