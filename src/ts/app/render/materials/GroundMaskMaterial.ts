import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class GroundMaskMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'GroundMaskMaterial',
			fragmentShader: Shaders.groundMask.fragment,
			vertexShader: Shaders.groundMask.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
