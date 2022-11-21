import {GroundGeometryBuffers} from "~/app/objects/Tile";
import Config from "~/app/Config";
import Vec3 from "~/math/Vec3";
import Vec2 from "~/math/Vec2";
import HeightViewer from "~/app/world/HeightViewer";

export interface GroundGeometryData {
	buffers: GroundGeometryBuffers;
	bbox: { min: number[]; max: number[] };
}

export default class GroundGeometryBuilder {
	public static createPlane(x: number, z: number, segmentsX: number, segmentsZ: number): {
		vertices: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
	} {
		const vertices: number[] = [];
		const indices: number[] = [];
		const uvs: number[] = [];

		const segmentSize = {
			x: x / segmentsX,
			z: z / segmentsZ
		};

		for (let z = 0; z <= segmentsZ; z++) {
			for (let x = 0; x <= segmentsX; x++) {
				vertices.push(x * segmentSize.x, 0, z * segmentSize.z);
				uvs.push(z / segmentsZ, x / segmentsX);
			}
		}

		for (let z = 0; z < segmentsZ; z++) {
			for (let x = 0; x < segmentsX; x++) {
				const isOdd = (x + z) % 2 === 1;

				const quad = [
					z * (segmentsX + 1) + x,
					z * (segmentsX + 1) + x + 1,
					(z + 1) * (segmentsX + 1) + x,
					(z + 1) * (segmentsX + 1) + x + 1,
				];

				if (isOdd) {
					indices.push(
						quad[1], quad[0], quad[3],
						quad[3], quad[0], quad[2]
					);
				} else {
					indices.push(
						quad[2], quad[1], quad[0],
						quad[3], quad[1], quad[2]
					);
				}
			}
		}

		return {vertices: new Float32Array(vertices), uvs: new Float32Array(uvs), indices: new Uint32Array(indices)};
	}

	public static createPlaneExtruded(x: number, z: number, segmentsX: number, segmentsZ: number): {
		vertices: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
		indicesExtruded: Uint32Array;
	} {
		const vertices: number[] = [];
		const indices: number[] = [];
		const indicesExtruded: number[] = [];
		const uvs: number[] = [];

		x += x / segmentsX * 2;
		z += z / segmentsZ * 2;
		segmentsX += 2;
		segmentsZ += 2;

		const segmentSize = {
			x: x / segmentsX,
			z: z / segmentsZ
		};

		for (let z = 0; z <= segmentsZ; z++) {
			for (let x = 0; x <= segmentsX; x++) {
				vertices.push(x * segmentSize.x - segmentSize.x, 0, z * segmentSize.z - segmentSize.z);
				uvs.push((z - 1) / (segmentsZ - 2), (x - 1) / (segmentsX - 2));
			}
		}

		for (let z = 0; z < segmentsZ; z++) {
			for (let x = 0; x < segmentsX; x++) {
				const isOdd = (x + z) % 2 === 1;

				const quad = [
					z * (segmentsX + 1) + x,
					z * (segmentsX + 1) + x + 1,
					(z + 1) * (segmentsX + 1) + x,
					(z + 1) * (segmentsX + 1) + x + 1,
				];

				const isNotExtruded = z > 0 && z < segmentsZ - 1 && x > 0 && x < segmentsX - 1;

				if (isOdd) {
					indicesExtruded.push(
						quad[1], quad[0], quad[3],
						quad[3], quad[0], quad[2]
					);

					if (isNotExtruded) {
						indices.push(
							quad[1], quad[0], quad[3],
							quad[3], quad[0], quad[2]
						);
					}
				} else {
					indicesExtruded.push(
						quad[2], quad[1], quad[0],
						quad[3], quad[1], quad[2]
					);

					if (isNotExtruded) {
						indices.push(
							quad[2], quad[1], quad[0],
							quad[3], quad[1], quad[2]
						);
					}
				}
			}
		}

		return {
			vertices: new Float32Array(vertices),
			uvs: new Float32Array(uvs),
			indices: new Uint32Array(indices),
			indicesExtruded: new Uint32Array(indicesExtruded)
		};
	}

	public static getGroundGeometry(tileX: number, tileY: number, heightViewer: HeightViewer): GroundGeometryData {
		const plane = GroundGeometryBuilder.createPlaneExtruded(
			Config.TileSize,
			Config.TileSize,
			Config.GroundSegments,
			Config.GroundSegments
		);

		const vertices = plane.vertices;
		const uvs = plane.uvs;

		let maxHeight = -Infinity, minHeight = Infinity;

		for(let i = 0; i < uvs.length / 2; i++) {
			let u = vertices[i * 3 + 2] / Config.TileSize;
			let v = 1 - vertices[i * 3] / Config.TileSize;

			if (u < 0) {
				tileX -= 1;
				u = 1 + u;
			}
			if (u > 1) {
				tileX += 1;
				u = u - 1;
			}
			if (v < 0) {
				tileY -= 1;
				v = 1 + v;
			}
			if (v > 1) {
				tileY += 1;
				v = v - 1;
			}

			const height = heightViewer.getHeight(tileX, tileY, u, v);

			vertices[i * 3 + 1] = height;

			maxHeight = Math.max(maxHeight, height);
			minHeight = Math.min(minHeight, height);
		}

		const normals = GroundGeometryBuilder.calculateGroundNormals(vertices, plane.indicesExtruded);

		return {
			buffers: {
				position: plane.vertices,
				uv: plane.uvs,
				normal: normals,
				index: plane.indices,
			},
			bbox: {
				min: [0, minHeight, 0],
				max: [Config.TileSize, maxHeight, Config.TileSize]
			}
		}
	}

	private static calculateGroundNormals(vertices: Float32Array, indices: Uint32Array): Float32Array {
		const normalBuffer = new Float32Array(vertices.length);

		const accumulatedNormals: Map<number, Vec3> = new Map();

		const buffer32 = new Float32Array(2);
		const buffer64 = new Float64Array(buffer32.buffer);

		const getVertexKey = (v: Vec2): number => {
			buffer32.set([v.x, v.y]);

			return buffer64[0];
		}

		for(let i = 0; i < indices.length; i += 3) {
			const aIndex = indices[i] * 3;
			const bIndex = indices[i + 1] * 3;
			const cIndex = indices[i + 2] * 3;

			const a = new Vec3(vertices[aIndex], vertices[aIndex + 1], vertices[aIndex + 2]);
			const b = new Vec3(vertices[bIndex], vertices[bIndex + 1], vertices[bIndex + 2]);
			const c = new Vec3(vertices[cIndex], vertices[cIndex + 1], vertices[cIndex + 2]);

			const triangleNormal = Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a));

			const triangleVertices = [a, b, c];

			for (const vertex of triangleVertices) {
				const key = getVertexKey(vertex.xz);
				const accum = accumulatedNormals.get(key) || new Vec3();
				const newValue = Vec3.add(accum, triangleNormal);

				accumulatedNormals.set(key, newValue);
			}
		}

		for (let i = 0; i < normalBuffer.length; i += 3) {
			const vertexX = vertices[i];
			const vertexZ = vertices[i + 2];

			const normalsSum = accumulatedNormals.get(getVertexKey(new Vec2(vertexX, vertexZ)));

			const normal = Vec3.normalize(normalsSum);

			normalBuffer[i] = normal.x;
			normalBuffer[i + 1] = normal.y;
			normalBuffer[i + 2] = normal.z;
		}

		return normalBuffer;
	}
}