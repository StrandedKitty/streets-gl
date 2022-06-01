import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BilateralBlurMaterial extends Material {
	public constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BilateralBlurMaterial',
			fragmentShader: Shaders.bilateralBlur.fragment,
			vertexShader: Shaders.bilateralBlur.vertex,
			uniforms: {
				direction: {type: UniformType.Float2, value: null},
				tColor: {type: UniformType.Texture2D, value: null},
				tPosition: {type: UniformType.Texture2D, value: null}
			}
		});
	}
}
