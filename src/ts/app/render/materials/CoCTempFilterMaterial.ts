import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";

export default class CoCTempFilterMaterial extends Material {
	public constructor(renderer: Renderer) {
		super(renderer, {
			name: 'CoCTempFilterMaterial',
			fragmentShader: Shaders.cocTempFilter.fragment,
			vertexShader: Shaders.cocTempFilter.vertex,
			uniforms: {
				tCoC: {
					type: UniformType.Texture2D,
					value: null
				},
				tCoCAccum: {
					type: UniformType.Texture2D,
					value: null
				},
				tMotion: {
					type: UniformType.Texture2D,
					value: null
				}
			}
		});
	}
}