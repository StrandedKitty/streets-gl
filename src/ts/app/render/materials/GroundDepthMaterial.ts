import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

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
