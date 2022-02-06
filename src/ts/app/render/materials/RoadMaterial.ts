import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../Shaders";
import Renderer from "../../../renderer/Renderer";
import GLConstants from "../../../renderer/GLConstants";
import Texture2DArray from "../../../renderer/Texture2DArray";

export default class RoadMaterial extends Material {
	constructor(renderer: Renderer) {
		super(renderer, {
			name: 'RoadMaterial',
			fragmentShader: Shaders.road.fragment,
			vertexShader: Shaders.road.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null},
				tMap: {
					type: UniformType.Texture2DArray,
					value: new Texture2DArray(renderer, {
						width: 512,
						height: 512,
						depth: 9,
						anisotropy: 16,
						urls: [
							'/textures/surfaces/pavement_diffuse.png',
							'/textures/surfaces/pavement_normal.png',
							'/textures/surfaces/pavement_mask.png',
							'/textures/surfaces/asphalt_diffuse.png',
							'/textures/surfaces/asphalt_normal.png',
							'/textures/surfaces/asphalt_mask.png',
							'/textures/surfaces/cobblestone_diffuse.png',
							'/textures/surfaces/cobblestone_normal.png',
							'/textures/surfaces/cobblestone_mask.png',
						],
						wrap: GLConstants.REPEAT
					})
				}
			}
		});
	}
}
