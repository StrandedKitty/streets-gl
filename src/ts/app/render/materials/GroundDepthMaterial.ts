import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2D from "../../../renderer/Texture2D";

export default class GroundDepthMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'GroundDepthMaterial',
			fragmentShader: Shaders.groundDepth.fragment,
			vertexShader: Shaders.groundDepth.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
