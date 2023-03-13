import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";

export default class WallsBuilder {
	public static build(
		{
			vertices,
			minHeight,
			height,
			levels,
			windowWidth,
			textureIdWindow,
			textureIdWall
		}: {
			vertices: Vec2[];
			minHeight: number;
			height: number | number[];
			levels: number;
			windowWidth: number;
			textureIdWindow: number;
			textureIdWall: number;
		}
	): {position: number[]; uv: number[]; normal: number[]; textureId: number[]} {
		let isClosed = false;

		if (vertices[0].equals(vertices[vertices.length - 1])) {
			vertices = vertices.slice(1);
			isClosed = true;

			if (typeof height !== 'number') {
				height = height.slice(1);
			}
		}

		const edgeSmoothness = this.getEdgeSmoothness(vertices, isClosed);
		const segmentNormals = this.getSegmentsNormals(vertices, isClosed);
		const walls = this.getWalls(vertices, isClosed, edgeSmoothness, windowWidth);

		const positions = this.getWallPositions(vertices, isClosed, height, minHeight);
		const {uvs, textureIds} = this.getWallUVsAndTextureIds({
			vertices,
			isClosed,
			height,
			minHeight,
			levels,
			textureIdWall,
			textureIdWindow,
			walls
		});
		const normals = this.getWallNormals(segmentNormals, edgeSmoothness, isClosed);

		return {
			position: positions,
			uv: uvs,
			normal: normals,
			textureId: textureIds
		};
	}

	private static getNextVertex(vertexIndex: number, vertices: Vec2[], isClosed: boolean): Vec2 | null {
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

	private static getPreviousVertex(vertexIndex: number, vertices: Vec2[], isClosed: boolean): Vec2 | null {
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

	private static getEdgeSmoothness(vertices: Vec2[], isClosed: boolean): boolean[] {
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

	private static getWalls(vertices: Vec2[], isClosed: boolean, edgeSmoothness: boolean[], windowWidth: number): [number, number, boolean][] {
		const uvProgress: [number, number][] = [];
		const segmentCount = isClosed ? vertices.length : (vertices.length - 1);
		let currentProgress = 0;

		for (let i = 0; i < segmentCount; i++) {
			const vertex = vertices[i];
			const nextVertex = this.getNextVertex(i, vertices, isClosed);

			if (!nextVertex) break;

			const segmentLength = Vec2.getLength(Vec2.sub(nextVertex, vertex));
			const isNextVertexSmooth = edgeSmoothness[i + 1] ?? edgeSmoothness[0];

			uvProgress.push([currentProgress, currentProgress + segmentLength]);

			if (!isNextVertexSmooth) {
				currentProgress = 0;
			} else {
				currentProgress += segmentLength
			}
		}

		const processedWalls: [number, number, boolean][] = [];
		let currentWall: [number, number, boolean][] = [];

		for (let i = 0; i < uvProgress.length; i++) {
			const segment = uvProgress[i];
			const nextSegment = uvProgress[i + 1];

			currentWall.push([segment[0], segment[1], false]);

			if (!nextSegment || nextSegment[0] === 0) {
				const wallLength = currentWall[currentWall.length - 1][1];
				const windowCount = Math.round(wallLength / windowWidth);
				const actualWindowWidth = wallLength / windowCount;

				if (windowCount > 0) {
					for (const segment of currentWall) {
						segment[0] /= actualWindowWidth;
						segment[1] /= actualWindowWidth;
						segment[2] = true;
					}
				} else {
					for (const segment of currentWall) {
						segment[0] /= windowWidth;
						segment[1] /= windowWidth;
						segment[2] = false;
					}
				}

				processedWalls.push(...currentWall);
				currentWall = [];
			}
		}

		return processedWalls;
	}

	private static getSegmentsNormals(vertices: Vec2[], isClosed: boolean): Vec3[] {
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

	private static getNextSegmentNormal(segmentIndex: number, segmentNormals: Vec3[], isClosed: boolean): Vec3 | null {
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

	private static getPreviousSegmentNormal(segmentIndex: number, segmentNormals: Vec3[], isClosed: boolean): Vec3 | null {
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

	private static getWallNormals(segmentNormals: Vec3[], edgeSmoothness: boolean[], isClosed: boolean): number[] {
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

	private static getWallPositions(vertices: Vec2[], isClosed: boolean, height: number | number[], minHeight: number): number[] {
		const positions: number[] = [];

		const segmentCount = isClosed ? vertices.length : (vertices.length - 1);

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
				nextVertexHeight = height[i + 1] ?? height[0];
			}

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);
			positions.push(vertex.x, minHeight, vertex.y);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(nextVertex.x, nextVertexHeight, nextVertex.y);
			positions.push(vertex.x, vertexHeight, vertex.y);
		}

		return positions;
	}

	private static getWallUVsAndTextureIds(
		{
			vertices,
			isClosed,
			height,
			minHeight,
			levels,
			textureIdWall,
			textureIdWindow,
			walls
		}: {
			vertices: Vec2[];
			isClosed: boolean;
			height: number | number[];
			minHeight: number;
			levels: number;
			textureIdWall: number;
			textureIdWindow: number;
			walls: [number, number, boolean][];
		}
	): {
		uvs: number[];
		textureIds: number[];
	} {
		const uvs: number[] = [];
		const textureIds: number[] = [];

		const segmentCount = isClosed ? vertices.length : (vertices.length - 1);

		for (let i = 0; i < segmentCount; i++) {
			let vertexHeight: number;
			let nextVertexHeight: number;

			if (typeof height === 'number') {
				vertexHeight = height;
				nextVertexHeight = height;
			} else {
				vertexHeight = height[i];
				nextVertexHeight = height[i + 1] ?? height[0];
			}

			vertexHeight -= minHeight;
			nextVertexHeight -= minHeight;

			const [uvXMin, uvXMax, hasWindow] = walls[i];

			let uvMax0 = levels;
			let uvMax1 = levels;

			if (vertexHeight > nextVertexHeight) {
				uvMax1 *= nextVertexHeight / vertexHeight;
			} else if (vertexHeight < nextVertexHeight) {
				uvMax0 *= vertexHeight / nextVertexHeight;
			}

			uvs.push(
				uvXMax, 0,
				uvXMin, uvMax0,
				uvXMin, 0
			);
			uvs.push(
				uvXMax, 0,
				uvXMax, uvMax1,
				uvXMin, uvMax0
			);

			const textureId = hasWindow ? textureIdWindow : textureIdWall;

			for (let i = 0; i < 6; i++) {
				textureIds.push(textureId);
			}
		}

		return {uvs, textureIds};
	}
}