import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import SeededRandom from "../../../math/SeededRandom";
import Vec3 from "../../../math/Vec3";
import MathUtils from "../../../math/MathUtils";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";

export default class SSAOMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'SSAOMaterial',
			fragmentShader: Shaders.ssao.fragment,
			vertexShader: Shaders.ssao.vertex,
			uniforms: {
				tPosition: {
					type: UniformType.Texture2D,
					value: null
				},
				tNormal: {
					type: UniformType.Texture2D,
					value: null
				},
				cameraProjectionMatrix: {
					type: UniformType.Matrix4,
					value: null
				},
				samples: {
					type: UniformType.Float3,
					value: null
				},
				tNoise: {
					type: UniformType.Texture2D,
					value: null
				}
			}
		});

		this.uniforms.samples.value = this.getRandomSamples(16);
		this.uniforms.tNoise.value = new Texture2D(renderer, {
			minFilter: GLConstants.NEAREST,
			magFilter: GLConstants.NEAREST,
			wrap: GLConstants.REPEAT,
			data: this.getRandomRotations(4),
			width: 4,
			height: 4
		});
	}

	private getRandomSamples(count: number): Float32Array {
		const random = new SeededRandom(3297);
		const samples: number[] = [];

		for (let i = 0; i < count; ++i) {
			let sample = new Vec3(random.generate() * 2 - 1, random.generate() * 2 - 1, random.generate());
			sample = Vec3.normalize(sample);

			let scale = i / count;
			scale = MathUtils.lerp(0.1, 1, scale ** 2);

			sample = Vec3.multiplyScalar(sample, scale);
			samples.push(sample.x, sample.y, sample.z);
		}

		return new Float32Array(samples);
	}

	private getRandomRotations(size: number): Uint8Array {
		const pixels: number[] = [];

		for (let i = 0; i < size ** 2; i++) {
			pixels.push(
				Math.floor(Math.random() * 255),
				Math.floor(Math.random() * 255),
				0,
				255
			);
		}

		return new Uint8Array(pixels);
	}
}