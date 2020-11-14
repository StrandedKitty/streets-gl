import Material, {UniformType} from "../../../renderer/Material";
import Renderer from "../../../renderer/Renderer";
import Shaders from "../Shaders";
import GBuffer from "../../../renderer/GBuffer";
import TextureCube from "../../../renderer/TextureCube";
import GLConstants from "../../../renderer/GLConstants";

export default class LDRComposeMaterial extends Material {
	constructor(renderer: Renderer, gBuffer: GBuffer) {
		super(renderer, {
			name: 'LDRComposeMaterial',
			fragmentShader: Shaders.ldrCompose.fragment,
			vertexShader: Shaders.ldrCompose.vertex,
			uniforms: {
				tHDR: {
					type: UniformType.Texture2D,
					value: gBuffer.framebufferHDR
				}
			}
		});
	}
}
