import Material, {UniformType} from "../../../renderer/Material";
import Renderer from "../../../renderer/Renderer";
import Shaders from "../Shaders";
import GBuffer from "../../../renderer/GBuffer";
import TextureCube from "../../../renderer/TextureCube";
import GLConstants from "../../../renderer/GLConstants";

const light = {
	direction: new Float32Array([-1, -1, -1]),
	range: -1,
	color: new Float32Array([1, 1, 1]),
	intensity: 5,
	position: new Float32Array([0, 0, 0]),
	innerConeCos: 1,
	outerConeCos: 0.7071067811865476,
	type: 0,
	padding: new Float32Array([0, 0])
};

export default class HDRComposeMaterial extends Material {
	constructor(renderer: Renderer, gBuffer: GBuffer) {
		super(renderer, {
			name: 'HDRComposeMaterial',
			fragmentShader: Shaders.hdrCompose.fragment,
			vertexShader: Shaders.hdrCompose.vertex,
			uniforms: {
				tColor: {
					type: UniformType.Texture2D,
					value: gBuffer.textures.color
				},
				tDepth: {
					type: UniformType.Texture2D,
					value: gBuffer.textures.depth
				},
				tNormal: {
					type: UniformType.Texture2D,
					value: gBuffer.textures.normal
				},
				tPosition: {
					type: UniformType.Texture2D,
					value: gBuffer.textures.position
				},
				viewMatrix: {
					type: UniformType.Matrix4,
					value: null
				},
				tSky: {
					type: UniformType.TextureCube,
					value: new TextureCube(renderer, {
						urls: [
							'/textures/sky/px.jpg',
							'/textures/sky/nx.jpg',
							'/textures/sky/py.jpg',
							'/textures/sky/ny.jpg',
							'/textures/sky/pz.jpg',
							'/textures/sky/nz.jpg'
						],
						minFilter: GLConstants.LINEAR_MIPMAP_LINEAR,
						magFilter: GLConstants.LINEAR
					})
				},
				'uLight.direction': {type: UniformType.Float3, value: [-1, -1, -1]},
				'uLight.range': {type: UniformType.Float1, value: light.range},
				'uLight.color': {type: UniformType.Float3, value: light.color},
				'uLight.intensity': {type: UniformType.Float1, value: light.intensity},
				'uLight.position': {type: UniformType.Float3, value: light.position},
				'uLight.innerConeCos': {type: UniformType.Float1, value: light.innerConeCos},
				'uLight.outerConeCos': {type: UniformType.Float1, value: light.outerConeCos},
				'uLight.type': {type: UniformType.Int1, value: light.type},
				'uLight.padding': {type: UniformType.Float2, value: light.padding}
			}
		});
	}
}
