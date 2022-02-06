import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class CoCDownscaleMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'CoCDownscaleMaterial',
			fragmentShader: Shaders.cocDownscale.fragment,
			vertexShader: Shaders.cocDownscale.vertex,
			uniforms: {
				tCoC: {
					type: UniformType.Texture2D,
					value: null
				},
				tColor: {
					type: UniformType.Texture2D,
					value: null
				}
			}
		});
	}
}