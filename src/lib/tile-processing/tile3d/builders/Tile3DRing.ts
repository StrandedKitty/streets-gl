import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";
import {colorToComponents} from "~/lib/tile-processing/tile3d/builders/utils";
import * as OMBB from "~/lib/math/OMBB";

export enum Tile3DRingType {
	Outer,
	Inner
}

type OMBBResult = [Vec2, Vec2, Vec2, Vec2];

export default class Tile3DRing {
	public readonly type: Tile3DRingType;
	public readonly nodes: Vec2[];

	private cachedFlattenVertices: number[] = null;
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

	private getOMBB(vertices: Vec2[]): [Vec2, Vec2, Vec2, Vec2] {
		if (!this.cachedOMBB) {
			const vectors: OMBB.Vector[] = vertices.map(v => new OMBB.Vector(v.x, v.y));
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

	public buildWalls(
		{
			minHeight,
			height,
			color,
			textureId
		}: {
			minHeight: number;
			height: number | number[];
			color: number;
			textureId: number;
		}, arrays: {
			position: number[];
			uv: number[];
			normal: number[];
			textureId: number[];
			color: number[];
		}
	): void {
		const positions = arrays.position;
		const uvs = arrays.uv;
		const normals = arrays.normal;
		const colors = arrays.color;
		const textureIds = arrays.textureId;

		const colorComponents = colorToComponents(color);

		const segmentNormals: Vec3[] = [];
		const edgeSmoothness: boolean[] = [];

		let uvX = 0;
		let uvMinY: number = 0;

		for (let i = 0; i < this.nodes.length - 1; i++) {
			const prevVertexId = i === 0 ? this.nodes.length - 2 : i - 1;

			const vertex = this.nodes[i];
			const nextVertex = this.nodes[i + 1];
			const prevVertex = this.nodes[prevVertexId];
			let vertexHeight: number;
			let nextVertexHeight: number;

			if (typeof height === 'number') {
				vertexHeight = height;
				nextVertexHeight = height;
			} else {
				vertexHeight = height[i];
				nextVertexHeight = height[i + 1];
			}

			const uvMaxY: number = vertexHeight - nextVertexHeight;
			const segmentLength = Vec2.distance(vertex, nextVertex);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);
			positions.push(vertex.x, minHeight, vertex.y);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(nextVertex.x, nextVertexHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);

			for (let i = 0; i < 6; i++) {
				colors.push(...colorComponents);
				textureIds.push(textureId);
			}

			const normal = MathUtils.calculateNormal(
				new Vec3(nextVertex.x, minHeight, nextVertex.y),
				new Vec3(vertex.x, vertexHeight, vertex.y),
				new Vec3(vertex.x, minHeight, vertex.y)
			);

			segmentNormals.push(Vec3.multiplyScalar(normal, segmentLength));

			const segmentVector = Vec2.normalize(Vec2.sub(nextVertex, vertex));
			const prevSegmentVector = Vec2.normalize(Vec2.sub(vertex, prevVertex));
			const dotProduct = Vec2.dot(segmentVector, prevSegmentVector);

			edgeSmoothness.push(dotProduct > Math.cos(MathUtils.toRad(Config.BuildingSmoothNormalsThreshold)));

			const nextUvX = uvX + segmentLength;

			uvs.push(
				nextUvX, uvMinY,
				uvX, uvMaxY,
				uvX, uvMinY
			);
			uvs.push(
				nextUvX, uvMinY,
				nextUvX, uvMaxY,
				uvX, uvMaxY
			);

			uvX = nextUvX;
		}

		for (let i = 0; i < segmentNormals.length; i++) {
			const normal = segmentNormals[i];
			const normalNormalized = Vec3.normalize(segmentNormals[i]);
			const nextNormal = i === segmentNormals.length - 1 ? segmentNormals[0] : segmentNormals[i + 1];
			const prevNormal = i === 0 ? segmentNormals[segmentNormals.length - 1] : segmentNormals[i - 1];

			const isSmooth: [boolean, boolean] = [
				edgeSmoothness[i],
				i === edgeSmoothness.length - 1 ? edgeSmoothness[0] : edgeSmoothness[i + 1]
			];

			const vertexSides: number[] = [1, 0, 0, 1, 1, 0];

			for (let j = 0; j < 6; j++) {
				const side = vertexSides[j];

				if (isSmooth[side]) {
					const neighborNormal = side === 1 ? nextNormal : prevNormal;
					normals.push(...Vec3.toArray(Vec3.normalize(Vec3.add(normal, neighborNormal))));
				} else {
					normals.push(normalNormalized.x, normalNormalized.y, normalNormalized.z);
				}
			}
		}
	}
}