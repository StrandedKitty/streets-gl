import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import Utils from "~/app/Utils";

export default class GeometryGroundProjector {
	public static project(
		{
			triangle,
			attributes,
			tileSize,
			segmentCount,
			height = 0
		}: {
			triangle: [number, number][];
			attributes: {[name: string]: [number, number][]};
			tileSize: number;
			segmentCount: number;
			height?: number;
		}
	): {
		position: Float32Array;
		attributes: {[name: string]: Float32Array};
	} {
		const triangleNormalized = this.normalizeTriangle(triangle, tileSize);
		const groundTriangles = this.getIntersectingGroundTrianglesForTriangle(triangleNormalized, segmentCount);
		const flatTriangle = triangleNormalized.flat();

		const positionArrays: Float32Array[] = [];
		const attributeArrays: Map<string, Float32Array[]> = new Map();

		for (const name of Object.keys(attributes)) {
			attributeArrays.set(name, []);
		}

		for (let i = 0; i < groundTriangles.length; i++) {
			const polygon = MathUtils.findIntersectionTriangleTriangle(groundTriangles[i], triangleNormalized);

			if (polygon.length === 0) {
				continue;
			}

			const triangulated = this.triangulateConvex(polygon);
			const vertices = new Float32Array(triangulated.length * 3);
			const attributesBuffers: Map<string, Float32Array> = new Map();

			for (const name of Object.keys(attributes)) {
				attributesBuffers.set(name, new Float32Array(triangulated.length * 2));
			}

			for (let i = 0; i < triangulated.length; i++) {
				const index = triangulated[i];
				const x = polygon[index][0];
				const z = polygon[index][1];

				vertices[i * 3] = x * tileSize;
				vertices[i * 3 + 1] = height;
				vertices[i * 3 + 2] = z * tileSize;

				for (const [name, attribute] of Object.entries(attributes)) {
					const bar = MathUtils.getBarycentricCoordinatesOfPoint(new Vec2(x, z), flatTriangle);

					const buffer = attributesBuffers.get(name);

					buffer[i * 2] = attribute[0][0] * bar.x + attribute[1][0] * bar.y + attribute[2][0] * bar.z;
					buffer[i * 2 + 1] = attribute[0][1] * bar.x + attribute[1][1] * bar.y + attribute[2][1] * bar.z;
				}
			}

			positionArrays.push(vertices);

			for (const [name, buffer] of attributesBuffers.entries()) {
				attributeArrays.get(name).push(buffer);
			}
		}

		return this.mergePositionsAndAttributes(positionArrays, attributeArrays);
	}

	public static projectLineSegment(
		{
			lineStart,
			lineEnd,
			tileSize,
			segmentCount
		}: {
			lineStart: Vec2;
			lineEnd: Vec2;
			tileSize: number;
			segmentCount: number;
		}
	): {vertices: Vec2[]; startProgress: number} {
		const lineStartNormalized = Vec2.multiplyScalar(lineStart, 1 / tileSize);
		const lineEndNormalized = Vec2.multiplyScalar(lineEnd, 1 / tileSize);

		const groundTriangles = this.getIntersectingGroundTrianglesForLine(
			lineStartNormalized,
			lineEndNormalized,
			segmentCount
		);

		if (groundTriangles.length === 0) {
			return {vertices: [], startProgress: 0};
		}

		const pointsProgressSet: Set<number> = new Set();

		if (lineStartNormalized.x >= 0. && lineStartNormalized.x <= 1. && lineStartNormalized.y >= 0. && lineStartNormalized.y <= 1.) {
			pointsProgressSet.add(0);
		}
		if (lineEndNormalized.x >= 0. && lineEndNormalized.x <= 1. && lineEndNormalized.y >= 0. && lineEndNormalized.y <= 1.) {
			pointsProgressSet.add(1);
		}

		for (const triangle of groundTriangles) {
			const intersections = MathUtils.getIntersectionsLineTriangle(
				Vec2.toArray(lineStartNormalized),
				Vec2.toArray(lineEndNormalized),
				triangle
			);

			for (const intersectionPoint of intersections) {
				const progress = MathUtils.getPointProgressAlongLineSegment(
					lineStartNormalized,
					lineEndNormalized,
					new Vec2(intersectionPoint[0], intersectionPoint[1])
				);
				pointsProgressSet.add(progress);
			}
		}

		const pointsProgress = Array.from(pointsProgressSet).sort((a, b) => a - b);
		const lineVector = Vec2.sub(lineEnd, lineStart);

		return {
			vertices: pointsProgress.map(progress => {
				return Vec2.add(lineStart, Vec2.multiplyScalar(lineVector, progress));
			}),
			startProgress: pointsProgress[0]
		};
	}

	private static normalizeTriangle(triangle: [number, number][], tileSize: number): [number, number][] {
		return triangle.map(vertex => [
			vertex[0] / tileSize,
			vertex[1] / tileSize
		]);
	}

	private static getIntersectingGroundTrianglesForTriangle(triangle: [number, number][], segmentCount: number): [number, number][][] {
		const groundTriangles: [number, number][][] = [];
		const coveredTiles = MathUtils.getTilesUnderTriangle(
			triangle,
			segmentCount, segmentCount,
			0, 0,
			segmentCount, segmentCount
		);

		for (const tilePos of coveredTiles) {
			groundTriangles.push(
				this.getTriangle(tilePos.x, tilePos.y, 0, segmentCount),
				this.getTriangle(tilePos.x, tilePos.y, 1, segmentCount)
			);
		}

		return groundTriangles;
	}

	private static getIntersectingGroundTrianglesForLine(
		lineStart: Vec2,
		lineEnd: Vec2,
		segmentCount: number
	): [number, number][][] {
		const groundTriangles: [number, number][][] = [];
		const tiles = MathUtils.getTilesIntersectingLine(
			Vec2.multiplyScalar(lineStart, segmentCount),
			Vec2.multiplyScalar(lineEnd, segmentCount)
		);

		for (const tilePos of tiles) {
			if (tilePos.x < 0 || tilePos.y < 0 || tilePos.x >= segmentCount || tilePos.y >= segmentCount) {
				continue;
			}

			groundTriangles.push(
				this.getTriangle(tilePos.x, tilePos.y, 0, segmentCount),
				this.getTriangle(tilePos.x, tilePos.y, 1, segmentCount)
			);
		}

		return groundTriangles;
	}

	private static mergePositionsAndAttributes(
		positionArrays: Float32Array[],
		attributeArrays: Map<string, Float32Array[]>
	): {
		position: Float32Array;
		attributes: {[name: string]: Float32Array};
	} {
		const mergedAttributes: {[attributeName: string]: Float32Array} = {};

		for (const [name, buffers] of attributeArrays.entries()) {
			mergedAttributes[name] = Utils.mergeTypedArrays(Float32Array, buffers);
		}

		return {
			position: Utils.mergeTypedArrays(Float32Array, positionArrays),
			attributes: mergedAttributes
		};
	}

	private static triangulateConvex(vertices: [number, number][]): number[] {
		const result: number[] = [];

		if (vertices.length < 3) {
			return result;
		}

		for (let i = 2; i < vertices.length; i++) {
			result.push(0, i, i - 1);
		}

		return result;
	}

	private static getTriangle(quadX: number, quadY: number, index: 0 | 1, segmentCount: number): [number, number][] {
		const quadSize = 1 / segmentCount;
		const normQuadX = quadX / segmentCount;
		const normQuadY = quadY / segmentCount;
		const isOdd = (quadX + quadY) % 2 === 1;

		const quadVertices = [
			normQuadX,
			normQuadY,
			normQuadX + quadSize,
			normQuadY,
			normQuadX + quadSize,
			normQuadY + quadSize,
			normQuadX,
			normQuadY + quadSize
		];

		let indices: number[];

		if (!isOdd) {
			if (index === 0) {
				indices = [0, 2, 1];
			} else {
				indices = [0, 3, 2];
			}
		} else {
			if (index === 0) {
				indices = [1, 0, 3];
			} else {
				indices = [1, 3, 2];
			}
		}

		const result: [number, number][] = [];

		for (let i = 0; i < 3; i++) {
			const vertexId = indices[i];
			const x = quadVertices[vertexId * 2];
			const y = quadVertices[vertexId * 2 + 1];

			result.push([x, y]);
		}

		return result;
	}
}