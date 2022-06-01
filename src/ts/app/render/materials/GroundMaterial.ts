import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";

export default class GroundMaterial extends Material {
	public constructor(renderer: Renderer) {
		super(renderer, {
			name: 'GroundMaterial',
			fragmentShader: Shaders.ground.fragment,
			vertexShader: Shaders.ground.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null},
				map: {
					type: UniformType.Texture2D,
					value: null
				},
				grass: {
					type: UniformType.Texture2D,
					value: new Texture2D(renderer, {
						url: "/textures/surfaces/grass_color.png",
						wrap: GLConstants.REPEAT,
						anisotropy: 16
					})
				},
				noise: {
					type: UniformType.Texture2D,
					value: new Texture2D(renderer, {
						url: "/textures/noise.png",
						wrap: GLConstants.REPEAT,
						anisotropy: 16
					})
				}
			}
		});
	}
}
