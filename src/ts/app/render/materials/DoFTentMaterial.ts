import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";

export default class DoFTentMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'DoFTentMaterial',
			fragmentShader: Shaders.dofTent.fragment,
			vertexShader: Shaders.dofTent.vertex,
			uniforms: {
				tMap: {
					type: UniformType.Texture2D,
					value: null
				}
			}
		});
	}
}