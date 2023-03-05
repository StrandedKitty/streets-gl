import Vec2 from "~/lib/math/Vec2";
import AABB2D from "~/lib/math/AABB2D";

export enum Tile3DRingType {
	Outer,
	Inner
}

export default class Tile3DRing {
	public readonly type: Tile3DRingType;
	public readonly nodes: Vec2[];

	private cachedFlattenVertices: number[] = null;
	private cachedGeoJSONVertices: [number, number][] = null;
	private cachedAABB: AABB2D = null;

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