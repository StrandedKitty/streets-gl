import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BuildingMaskMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BuildingMaskMaterial',
			fragmentShader: Shaders.buildingMask.fragment,
			vertexShader: Shaders.buildingMask.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				objectId: {type: UniformType.Uint1, value: 0}
			}
		});
	}
}
