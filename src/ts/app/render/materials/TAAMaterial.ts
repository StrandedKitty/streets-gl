import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";

export default class TAAMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'TAAMaterial',
			fragmentShader: Shaders.taa.fragment,
			vertexShader: Shaders.taa.vertex,
			uniforms: {
				tAccum: {
					type: UniformType.Texture2D,
					value: null
				},
				tNew: {
					type: UniformType.Texture2D,
					value: null
				},
				tMotion: {
					type: UniformType.Texture2D,
					value: null
				},
				ignoreHistory: {
					type: UniformType.Int1,
					value: 0
				}
			}
		});
	}
}