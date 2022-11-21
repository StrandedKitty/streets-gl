import HeightViewer from "../../HeightViewer";
import Vec2 from "../../../../math/Vec2";
import Config from "../../../Config";
import Utils from "../../../Utils";
import MathUtils from "../../../../math/MathUtils";
import {GroundGeometryBuffers} from "~/app/objects/Tile";

const vertexPos = new Vec2();

export default class MeshGroundProjector {
	private readonly heightViewer: HeightViewer;
	private readonly tilePosition: Vec2;
	private readonly ground: GroundGeometryBuffers;
	private heightCache: Map<string, number[]> = new Map();
	private normalCache: Map<string, number[]> = new Map();

	public constructor(tileX: number, tileY: number, heightViewer: HeightViewer, ground: GroundGeometryBuffers) {
		this.heightViewer = heightViewer;
		this.tilePosition = new Vec2(tileX, tileY);
		this.ground = ground;

		for(let x = 0; x < Config.GroundSegments; x++) {
			for(let y = 0; y < Config.GroundSegments; y++) {
				this.getGroundTriangleHeight(x, y, 0);
				this.getGroundTriangleHeight(x, y, 1);

				this.getGroundTriangleNormals(x, y, 0);
				this.getGroundTriangleNormals(x, y, 1);
			}
		}
	}

	public project(
		projectedTri: [number, number][],
		attributes: {[attributeName: string]: [number, number][]}
	): {position: Float32Array; normal: Float32Array; attributes: {[name: string]: Float32Array}} {
		const positionTris: number[][] = [];
		const normalTris: number[][] = [];
		const coveredTiles = MeshGroundProjector.getTilesUnderTriangle(projectedTri, Config.GroundSegments, Config.GroundSegments);

		for(const tilePos of coveredTiles) {
			positionTris.push(this.getGroundTriangleHeight(tilePos.x, tilePos.y, 0));
			positionTris.push(this.getGroundTriangleHeight(tilePos.x, tilePos.y, 1));

			normalTris.push(this.getGroundTriangleNormals(tilePos.x, tilePos.y, 0));
			normalTris.push(this.getGroundTriangleNormals(tilePos.x, tilePos.y, 1));
		}

		const positionArrays: Float32Array[] = [];
		const normalArrays: Float32Array[] = [];
		const attributeArrays: Map<string, Float32Array[]> = new Map();

		for (const name of Object.keys(attributes)) {
			attributeArrays.set(name, []);
		}

		for(let i = 0; i < positionTris.length; i++) {
			const verticesHeight = positionTris[i];
			const verticesNormals = normalTris[i];

			const triPoints: [number, number][] = [
				[verticesHeight[0], verticesHeight[2]],
				[verticesHeight[3], verticesHeight[5]],
				[verticesHeight[6], verticesHeight[8]]
			];

			const polygon = MathUtils.findIntersectionTriangleTriangle(triPoints, projectedTri);

			if(polygon.length > 0) {
				const triangulated = this.triangulate(polygon);
				const vertices = new Float32Array(triangulated.length * 3);
				const normals = new Float32Array(triangulated.length * 3);

				const attributesBuffers: Map<string, Float32Array> = new Map();

				for (const name of Object.keys(attributes)) {
					attributesBuffers.set(name, new Float32Array(triangulated.length * 2));
				}

				for (let i = 0; i < triangulated.length; i++) {
					const index = triangulated[i];
					const x = vertexPos.x = polygon[index][0];
					const z = vertexPos.y = polygon[index][1];

					const bar = MathUtils.getBarycentricCoordinatesOfPoint(vertexPos, triPoints.flat());

					const weightedNormals = [
						[verticesNormals[0] * bar.x, verticesNormals[1] * bar.x, verticesNormals[2] * bar.x],
						[verticesNormals[3] * bar.y, verticesNormals[4] * bar.y, verticesNormals[5] * bar.y],
						[verticesNormals[6] * bar.z, verticesNormals[7] * bar.z, verticesNormals[8] * bar.z]
					];

					const normalsSum = [
						weightedNormals[0][0] + weightedNormals[1][0] + weightedNormals[2][0],
						weightedNormals[0][1] + weightedNormals[1][1] + weightedNormals[2][1],
						weightedNormals[0][2] + weightedNormals[1][2] + weightedNormals[2][2]
					];

					normals[i * 3] = normalsSum[0];
					normals[i * 3 + 1] = normalsSum[1];
					normals[i * 3 + 2] = normalsSum[2];

					const offsetWeight = 0;

					const weightedHeight = bar.x * verticesHeight[1] + bar.y * verticesHeight[4] + bar.z * verticesHeight[7];

					vertices[i * 3] = x * Config.TileSize + normalsSum[0] * offsetWeight;
					vertices[i * 3 + 1] = weightedHeight + normalsSum[1] * offsetWeight;
					vertices[i * 3 + 2] = z * Config.TileSize + normalsSum[2] * offsetWeight;

					for (const [name, attribute] of Object.entries(attributes)) {
						const bar = MathUtils.getBarycentricCoordinatesOfPoint(new Vec2(x, z), projectedTri.flat());

						const buffer = attributesBuffers.get(name);

						buffer[i * 2] = attribute[0][0] * bar.x + attribute[1][0] * bar.y + attribute[2][0] * bar.z;
						buffer[i * 2 + 1] = attribute[0][1] * bar.x + attribute[1][1] * bar.y + attribute[2][1] * bar.z;
					}
				}

				positionArrays.push(vertices);
				normalArrays.push(normals);

				for (const [name, buffer] of attributesBuffers.entries()) {
					attributeArrays.get(name).push(buffer);
				}
			}
		}

		const mergedAttributes: {[attributeName: string]: Float32Array} = {};

		for (const [name, buffers] of attributeArrays.entries()) {
			mergedAttributes[name] = Utils.mergeTypedArrays(Float32Array, buffers);
		}

		return {
			position: Utils.mergeTypedArrays(Float32Array, positionArrays),
			normal: Utils.mergeTypedArrays(Float32Array, normalArrays),
			attributes: mergedAttributes
		};
	}

	private triangulate(vertices: [number, number][]): number[] {
		const result: number[] = [];

		if (vertices.length < 3) {
			return result;
		}

		for (let i = 2; i < vertices.length; i++) {
			result.push(0, i, i - 1);
		}

		return result;
	}

	private static getTilesUnderTriangle(
		triangle: [number, number][],
		triangleScaleX: number,
		triangleScaleY: number
	): Vec2[] {
		const sx = triangleScaleX;
		const sy = triangleScaleY;
		const pointA = new Vec2(triangle[0][0] * sx, triangle[0][1] * sy);
		const pointB = new Vec2(triangle[1][0] * sx, triangle[1][1] * sy);
		const pointC = new Vec2(triangle[2][0] * sx, triangle[2][1] * sy);

		const tilesA = MathUtils.getTilesIntersectingLine(pointA, pointB);
		const tilesB = MathUtils.getTilesIntersectingLine(pointB, pointC);
		const tilesC = MathUtils.getTilesIntersectingLine(pointC, pointA);

		const tilesOnEdges: Vec2[] = tilesA.concat(tilesB, tilesC);
		const tilesUnderTriangle: Vec2[] = [];

		let minY = Infinity;
		let maxY = -Infinity;
		let minX = 0;

		for (const tile of tilesOnEdges) {
			if (minY <= tile.y) {
				minX = Math.min(tile.x, minX);
			}

			minY = Math.min(tile.y, minY);
			maxY = Math.max(tile.y, maxY);
		}

		for (let y = minY; y <= maxY; y++) {
			const minX = tilesOnEdges.reduce((a, b) => a.x < b.x ? a : b).x;
			const maxX = tilesOnEdges.reduce((a, b) => a.x > b.x ? a : b).x;

			for (let x = minX; x <= maxX; x++) {
				if (x < 0 || y < 0 || x >= triangleScaleX || y >= triangleScaleY) {
					continue;
				}

				tilesUnderTriangle.push(new Vec2(x, y));
			}
		}

		return tilesUnderTriangle;
	}

	private getGroundTriangleHeight(quadX: number, quadY: number, index: 0 | 1): number[] {
		const cached = this.heightCache.get(`${quadX} ${quadY} ${index}`);

		if (cached) {
			return cached;
		}

		const quadSize = 1 / Config.GroundSegments;
		const normQuadX = quadX / Config.GroundSegments;
		const normQuadY = quadY / Config.GroundSegments;
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

		let vertices: number[];

		if (isOdd) {
			if (index === 0) {
				vertices = [0, 2, 1];
			} else {
				vertices = [0, 3, 2];
			}
		} else {
			if (index === 0) {
				vertices = [1, 0, 3];
			} else {
				vertices = [1, 3, 2];
			}
		}

		const result: number[] = new Array(9);

		for (let i = 0; i < 3; i++) {
			const vertexId = vertices[i];
			const x = quadVertices[vertexId * 2];
			const y = quadVertices[vertexId * 2 + 1];

			result[i * 3] = x;
			result[i * 3 + 2] = y;

			result[i * 3 + 1] = this.heightViewer.getHeight(this.tilePosition.x, this.tilePosition.y, y, 1 - x);
		}

		this.heightCache.set(`${quadX} ${quadY} ${index}`, result);

		return result;
	}

	private getGroundTriangleNormals(quadX: number, quadY: number, index: 0 | 1): number[] {
		const cached = this.normalCache.get(`${quadX} ${quadY} ${index}`);

		if (cached) {
			return cached;
		}

		const x = quadX + 1;
		const y = quadY + 1;

		const isOdd = (x + y) % 2 === 1;
		const sideLength = Config.GroundSegments + 3;

		const quadVertices = [
			...this.getGroundVertexNormal(x + y * sideLength),
			...this.getGroundVertexNormal(x + 1 + y * sideLength),
			...this.getGroundVertexNormal(x + 1 + (y + 1) * sideLength),
			...this.getGroundVertexNormal(x + (y + 1) * sideLength)
		];

		let indices: number[];

		if (isOdd) {
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

		const result: number[] = new Array(9);

		for (let i = 0; i < 3; i++) {
			const vertexId = indices[i];

			result[i * 3] = quadVertices[vertexId * 3];
			result[i * 3 + 1] = quadVertices[vertexId * 3 + 1];
			result[i * 3 + 2] = quadVertices[vertexId * 3 + 2];
		}

		this.normalCache.set(`${quadX} ${quadY} ${index}`, result);

		return result;
	}

	private getGroundVertexNormal(id: number): [number, number, number] {
		const buffer = this.ground.normal;

		return [
			buffer[id * 3],
			buffer[id * 3 + 1],
			buffer[id * 3 + 2]
		];
	}
}