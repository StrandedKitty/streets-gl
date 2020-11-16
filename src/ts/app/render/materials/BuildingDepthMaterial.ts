import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BuildingDepthMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BuildingDepthMaterial',
			fragmentShader: Shaders.buildingDepth.fragment,
			vertexShader: Shaders.buildingDepth.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
