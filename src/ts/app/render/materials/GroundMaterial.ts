import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2D from "../../../renderer/Texture2D";

export default class GroundMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'GroundMaterial',
			fragmentShader: Shaders.ground.fragment,
			vertexShader: Shaders.ground.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				map: {
					type: UniformType.Texture2D,
					value: new Texture2D(renderer, {url: '/images/favicon.png', flipY: false, anisotropy: 16})
				}
			}
		});
	}
}
