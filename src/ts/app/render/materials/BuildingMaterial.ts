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
				tRoof: {
					type: UniformType.Texture2DArray, value: new Texture2DArray(renderer, {
						depth: 4,
						anisotropy: 16,
						url: 'https://i.imgur.com/1DRnbyr.png',
						wrap: GLConstants.CLAMP_TO_EDGE
					})
				},
			}
		});
	}
}
