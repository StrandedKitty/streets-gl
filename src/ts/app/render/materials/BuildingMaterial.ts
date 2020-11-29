import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import Texture2DArray from "../../../renderer/Texture2DArray";
import GLConstants from "../../../renderer/GLConstants";

export default class BuildingMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'BuildingMaterial',
			fragmentShader: Shaders.building.fragment,
			vertexShader: Shaders.building.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null},
				tileId: {type: UniformType.Int1, value: 0},
				tRoof: {
					type: UniformType.Texture2DArray, value: new Texture2DArray(renderer, {
						width: 512,
						height: 512,
						depth: 4,
						anisotropy: 16,
						urls: [
							'/textures/buildings/roofs/1_color.png',
							'/textures/buildings/roofs/2_color.png',
							'/textures/buildings/roofs/3_color.png',
							'/textures/buildings/roofs/4_color.png'
						],
						wrap: GLConstants.CLAMP_TO_EDGE
					})
				},
			}
		});
	}
}
