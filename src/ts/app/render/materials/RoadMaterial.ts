import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";

export default class RoadMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'RoadMaterial',
			fragmentShader: Shaders.road.fragment,
			vertexShader: Shaders.road.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null}
			}
		});
	}
}
