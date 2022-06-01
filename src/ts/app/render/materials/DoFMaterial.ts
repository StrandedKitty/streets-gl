import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";

export default class DoFMaterial extends Material {
	public constructor(renderer: Renderer) {
		super(renderer, {
			name: 'DoFMaterial',
			fragmentShader: Shaders.dof.fragment,
			vertexShader: Shaders.dof.vertex,
			uniforms: {
				tCoC: {
					type: UniformType.Texture2D,
					value: null
				},
				uBokehRadius: {
					type: UniformType.Float1,
					value: 6
				}
			}
		});
	}
}