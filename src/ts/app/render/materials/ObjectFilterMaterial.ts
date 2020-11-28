import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2DArray from "../../../renderer/Texture2DArray";
import GLConstants from "../../../renderer/GLConstants";

export default class ObjectFilterMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'ObjectFilterMaterial',
			fragmentShader: Shaders.objectFilter.fragment,
			vertexShader: Shaders.objectFilter.vertex,
			uniforms: {
				objectId: {type: UniformType.Uint1, value: 0},
				tSource: {type: UniformType.Texture2D, value: null}
			}
		});
	}
}
