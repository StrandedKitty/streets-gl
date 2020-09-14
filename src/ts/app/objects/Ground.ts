import Mesh from "../../renderer/Mesh";
import GLConstants from "../../renderer/GLConstants";
import Renderer from "../../renderer/Renderer";
import Config from "../Config";
import HeightProvider from "../HeightProvider";

export default class Ground extends Mesh {
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
	}

	public applyHeightmap(x: number, y: number) {
		const vertices = this.attributes.get('position').buffer;
		const uvs = this.attributes.get('uv').buffer;

		for(let i = 0; i < uvs.length / 2; i++) {
			vertices[i * 3 + 1] = HeightProvider.getHeight(x, y, uvs[i * 2], 1 - uvs[i * 2 + 1]);
		}
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
				vertices.push((x - 1) * segmentSize.x, 0, z * segmentSize.z);
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
