import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BasicMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BasicMaterial',
			fragmentShader: Shaders.basic.fragment,
			vertexShader: Shaders.basic.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
