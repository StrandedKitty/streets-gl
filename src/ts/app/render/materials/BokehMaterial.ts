import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BokehMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BokehMaterial',
			fragmentShader: Shaders.bokeh.fragment,
			vertexShader: Shaders.bokeh.vertex,
			uniforms: {
				tColor: {
					type: UniformType.Texture2D,
					value: null
				},
				tPosition: {
					type: UniformType.Texture2D,
					value: null
				},
				uPixelSize: {
					type: UniformType.Float2,
					value: null
				},
				uFar: {
					type: UniformType.Float1,
					value: 25000
				},
				uFocusPoint: {
					type: UniformType.Float1,
					value: 0
				}
			}
		});
	}
}