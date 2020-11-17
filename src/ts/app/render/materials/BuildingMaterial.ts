import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";

export default class BuildingMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BuildingMaterial',
			fragmentShader: Shaders.building.fragment,
			vertexShader: Shaders.building.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
