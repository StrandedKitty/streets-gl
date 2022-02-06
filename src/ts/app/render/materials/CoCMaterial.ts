import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class CoCMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'CoCMaterial',
			fragmentShader: Shaders.coc.fragment,
			vertexShader: Shaders.coc.vertex,
			uniforms: {
				tPosition: {
					type: UniformType.Texture2D,
					value: null
				},
				uFar: {
					type: UniformType.Float1,
					value: 25000
				},
				uFocusPoint: {
					type: UniformType.Float1,
					value: 0
				},
				uCoCScale: {
					type: UniformType.Float1,
					value: 8
				},
				uFocusScale: {
					type: UniformType.Float1,
					value: 0.5
				}
			}
		});
	}
}