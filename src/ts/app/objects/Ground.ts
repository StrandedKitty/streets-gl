import Mesh from "../../renderer/Mesh";
import GLConstants from "../../renderer/GLConstants";
import Renderer from "../../renderer/Renderer";
import Config from "../Config";
import HeightProvider from "../world/HeightProvider";
import Vec3 from "../../math/Vec3";
import Tile from "./Tile";

export default class Ground extends Mesh {
	public borderVertices: number[];

	constructor(renderer: Renderer) {
		super(renderer);

		const {vertices, uvs, indices} = Ground.createPlane(Config.TileSize, Config.TileSize, 36, 36);

		this.indexed = true;
		this.indices = indices;
		this.updateIndexBuffer();

		this.addAttribute({name: 'position'});
		this.setAttributeData('position', vertices);

		this.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});
		this.setAttributeData('uv', uvs);

		this.addAttribute({
			name: 'normal',
			size: 3,
			type: GLConstants.FLOAT,
			normalized: false
		});
		this.setAttributeData('normal', new Float32Array(this.attributes.get('position').buffer.length));
	}

	public applyHeightmap(x: number, y: number) {
		const vertices = this.attributes.get('position').buffer;
		const uvs = this.attributes.get('uv').buffer;

		for(let i = 0; i < uvs.length / 2; i++) {
			vertices[i * 3 + 1] = HeightProvider.getHeight(x, y, uvs[i * 2], 1 - uvs[i * 2 + 1]);
		}

		this.calculateNormals();
		this.updateBorderVertices();
	}

	private calculateNormals() {
		const vertices = this.attributes.get('position').buffer;
		const normalBuffer = new Float32Array(vertices.length);

		for(let i = 0; i < this.indices.length; i += 3) {
			const aIndex = this.indices[i] * 3;
			const bIndex = this.indices[i + 1] * 3;
			const cIndex = this.indices[i + 2] * 3;

			const a = new Vec3(vertices[aIndex], vertices[aIndex + 1], vertices[aIndex + 2]);
			const b = new Vec3(vertices[bIndex], vertices[bIndex + 1], vertices[bIndex + 2]);
			const c = new Vec3(vertices[cIndex], vertices[cIndex + 1], vertices[cIndex + 2]);

			const weight = Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a));

			normalBuffer[aIndex] += weight.x;
			normalBuffer[bIndex] += weight.x;
			normalBuffer[cIndex] += weight.x;

			normalBuffer[aIndex + 1] += weight.y;
			normalBuffer[bIndex + 1] += weight.y;
			normalBuffer[cIndex + 1] += weight.y;

			normalBuffer[aIndex + 2] += weight.z;
			normalBuffer[bIndex + 2] += weight.z;
			normalBuffer[cIndex + 2] += weight.z;
		}

		for(let i = 0; i < normalBuffer.length; i += 3) {
			const length = Math.sqrt(normalBuffer[i] ** 2 + normalBuffer[i + 1] ** 2 + normalBuffer[i + 2] ** 2);

			normalBuffer[i] /= length;
			normalBuffer[i + 1] /= length;
			normalBuffer[i + 2] /= length;
		}

		this.setAttributeData('normal', normalBuffer);
		this.updateAttribute('normal');
	}

	private updateBorderVertices() {
		const vertices = this.attributes.get('position').buffer;
		const uvs = this.attributes.get('uv').buffer;

		this.borderVertices = [];

		for(let i = 0; i < vertices.length / 3; i ++) {
			if(uvs[i * 2] % 1 === 0 || uvs[i * 2 + 1] % 1 === 0) {
				this.borderVertices.push(i);
			}
		}
	}

	public updateBorderNormals(x: number, y: number, neighbors: Tile[]) {
		const normals = this.attributes.get('normal').buffer;
		const uvs = this.attributes.get('uv').buffer;

		for(const vertexIndex of this.borderVertices) {
			const i = vertexIndex * 3;
			const normal = new Vec3(normals[i], normals[i + 1], normals[i + 2]);

			for(const neighbor of neighbors) {
				const neighborUVs = neighbor.ground.attributes.get('uv').buffer;
				const neighborNormals = neighbor.ground.attributes.get('normal').buffer;

				const dx = neighbor.x - x;
				const dy = neighbor.y - y;

				for(const neighborIndex of neighbor.ground.borderVertices) {
					const j = neighborIndex * 3;

					if(
						uvs[i / 3 * 2] - dx === neighborUVs[neighborIndex * 2] &&
						uvs[i / 3 * 2 + 1] + dy === neighborUVs[neighborIndex * 2 + 1]
					) {
						const neighborNormal = new Vec3(
							neighborNormals[j],
							neighborNormals[j + 1],
							neighborNormals[j + 2]
						);
						const fixedNormal = Vec3.normalize(Vec3.multiplyScalar(Vec3.add(normal, neighborNormal), 0.5));

						neighborNormals[j] = normals[i] = fixedNormal.x;
						neighborNormals[j + 1] = normals[i + 1] = fixedNormal.y;
						neighborNormals[j + 2] = normals[i + 2] = fixedNormal.z;
					}
				}
			}
		}

		for(const neighbor of neighbors) {
			neighbor.ground.updateAttribute('normal');
		}

		this.updateAttribute('normal');
	}

	static createPlane(x: number, z: number, segmentsX: number, segmentsZ: number) {
		const vertices: number[] = [];
		const indices: number[] = [];
		const uvs: number[] = [];

		const segmentSize = {
			x: x / segmentsX,
			z: z / segmentsZ
		};

		for(let z = 0; z <= segmentsZ; z++) {
			for(let x = 0; x <= segmentsX; x++) {
				vertices.push(x * segmentSize.x, 0, z * segmentSize.z);
				uvs.push(z / segmentsZ, x / segmentsX);
			}
		}

		for(let z = 0; z < segmentsZ; z++) {
			for(let x = 0; x < segmentsX; x++) {
				const isOdd = (x + z) % 2 === 1;

				const quad = [
					z * (segmentsX + 1) + x,
					z * (segmentsX + 1) + x + 1,
					(z + 1) * (segmentsX + 1) + x,
					(z + 1) * (segmentsX + 1) + x + 1,
				];

				if(isOdd) {
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
	};
}
