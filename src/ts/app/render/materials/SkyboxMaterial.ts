import Material, {UniformType} from "../../../renderer/Material";
import Shaders from "../shaders/Shaders";
import Renderer from "../../../renderer/Renderer";
import TextureCube from "../../../renderer/TextureCube";

export default class SkyboxMaterial extends Material {
	public constructor(renderer: Renderer) {
		super(renderer, {
			name: 'SkyboxMaterial',
			fragmentShader: Shaders.skybox.fragment,
			vertexShader: Shaders.skybox.vertex,
			uniforms: {
				projectionMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrix: {type: UniformType.Matrix4, value: null},
				modelViewMatrixPrev: {type: UniformType.Matrix4, value: null},
				tSky: {
					type: UniformType.TextureCube,
					value: new TextureCube(renderer, {
						urls: [
							'/textures/sky/px.jpg',
							'/textures/sky/nx.jpg',
							'/textures/sky/py.jpg',
							'/textures/sky/ny.jpg',
							'/textures/sky/pz.jpg',
							'/textures/sky/nz.jpg'
						]
					})
				}
			}
		});
	}
}