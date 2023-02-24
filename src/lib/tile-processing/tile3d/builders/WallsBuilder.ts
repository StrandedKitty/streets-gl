import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";

export default class WallsBuilder {
	public build(
		{
			vertices,
			minHeight,
			height
		}: {
			vertices: Vec2[];
			minHeight: number;
			height: number | number[];
		}
	): {position: number[]; uv: number[]; normal: number[]} {
		const positions: number[] = [];
		const uvs: number[] = [];

		let isClosed = false;

		if (vertices[0] === vertices[vertices.length - 1]) {
			vertices = vertices.slice(1);
			isClosed = true;
		}

		const segmentCount = isClosed ? vertices.length : (vertices.length - 1);

		let uvX = 0;
		let uvMinY: number = 0;

		for (let i = 0; i < segmentCount; i++) {
			const vertex = vertices[i];
			const nextVertex = this.getNextVertex(i, vertices, isClosed);
			let vertexHeight: number;
			let nextVertexHeight: number;

			if (typeof height === 'number') {
				vertexHeight = height;
				nextVertexHeight = height;
			} else {
				vertexHeight = height[i];
				nextVertexHeight = height[i + 1];
			}

			const uvMaxY = vertexHeight - nextVertexHeight;
			const segmentLength = Vec2.distance(vertex, nextVertex);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);
			positions.push(vertex.x, minHeight, vertex.y);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(nextVertex.x, nextVertexHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);

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

		const edgeSmoothness = this.getEdgeSmoothness(vertices, isClosed);
		const segmentNormals = this.getSegmentsNormals(vertices, isClosed);
		const normals = this.getWallNormals(segmentNormals, edgeSmoothness, isClosed);

		return {
			position: positions,
			uv: uvs,
			normal: normals
		};
	}

	private getNextVertex(vertexIndex: number, vertices: Vec2[], isClosed: boolean): Vec2 | null {
		const index = vertexIndex + 1;

		if (index > vertices.length - 1) {
			if (isClosed) {
				return vertices[0];
			} else {
				return null;
			}
		}

		return vertices[index];
	}

	private getPreviousVertex(vertexIndex: number, vertices: Vec2[], isClosed: boolean): Vec2 | null {
		const index = vertexIndex - 1;

		if (index < 0) {
			if (isClosed) {
				return vertices[vertices.length - 1];
			} else {
				return null;
			}
		}

		return vertices[index];
	}

	private getEdgeSmoothness(vertices: Vec2[], isClosed: boolean): boolean[] {
		const edgeSmoothness: boolean[] = [];

		for (let i = 0; i < vertices.length; i++) {
			const vertex = vertices[i];
			const nextVertex = this.getNextVertex(i, vertices, isClosed);
			const prevVertex = this.getPreviousVertex(i, vertices, isClosed);

			if (!nextVertex || !prevVertex) {
				edgeSmoothness.push(false);
				continue;
			}

			const segmentVector = Vec2.normalize(Vec2.sub(nextVertex, vertex));
			const prevSegmentVector = Vec2.normalize(Vec2.sub(vertex, prevVertex));
			const dotProduct = Vec2.dot(segmentVector, prevSegmentVector);

			edgeSmoothness.push(dotProduct > Math.cos(MathUtils.toRad(Config.BuildingSmoothNormalsThreshold)));
		}

		return edgeSmoothness;
	}

	private getSegmentsNormals(vertices: Vec2[], isClosed: boolean): Vec3[] {
		const normals: Vec3[] = [];
		const segmentCount = isClosed ? vertices.length : (vertices.length - 1);

		for (let i = 0; i < segmentCount; i++) {
			const vertex = vertices[i];
			const nextVertex = this.getNextVertex(i, vertices, isClosed);
			const segmentLength = Vec2.distance(vertex, nextVertex);

			const normal = MathUtils.calculateNormal(
				new Vec3(nextVertex.x, 0, nextVertex.y),
				new Vec3(vertex.x, 1, vertex.y),
				new Vec3(vertex.x, 0, vertex.y)
			);

			normals.push(Vec3.multiplyScalar(normal, segmentLength));
		}

		return normals;
	}

	private getNextSegmentNormal(segmentIndex: number, segmentNormals: Vec3[], isClosed: boolean): Vec3 | null {
		const index = segmentIndex + 1;

		if (index > segmentNormals.length - 1) {
			if (isClosed) {
				return segmentNormals[0];
			} else {
				return null;
			}
		}

		return segmentNormals[index];
	}

	private getPreviousSegmentNormal(segmentIndex: number, segmentNormals: Vec3[], isClosed: boolean): Vec3 | null {
		const index = segmentIndex - 1;

		if (index < 0) {
			if (isClosed) {
				return segmentNormals[segmentNormals.length - 1];
			} else {
				return null;
			}
		}

		return segmentNormals[index];
	}

	private getWallNormals(segmentNormals: Vec3[], edgeSmoothness: boolean[], isClosed: boolean): number[] {
		const normals: number[] = [];

		for (let i = 0; i < segmentNormals.length; i++) {
			const normal = segmentNormals[i];
			const normalNormalized = Vec3.normalize(segmentNormals[i]);

			const nextNormal = this.getNextSegmentNormal(i, segmentNormals, isClosed) ?? normal;
			const prevNormal = this.getPreviousSegmentNormal(i, segmentNormals, isClosed) ?? normal;

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

		return normals;
	}
}