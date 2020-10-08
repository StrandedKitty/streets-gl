import Material, {UniformType} from "../../../renderer/Material";
import Renderer from "../../../renderer/Renderer";
import Shaders from "../Shaders";
import GBuffer from "../../../renderer/GBuffer";

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
				}
			}
		});
	}
}
