import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import ResourceManager from "~/app/world/ResourceManager";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class RoadMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Road material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 9,
						anisotropy: 16,
						data: [
							ResourceManager.get('pavementDiffuse'),
							ResourceManager.get('pavementNormal'),
							ResourceManager.get('pavementMask'),
							ResourceManager.get('asphaltDiffuse'),
							ResourceManager.get('asphaltNormal'),
							ResourceManager.get('asphaltMask'),
							ResourceManager.get('cobblestoneDiffuse'),
							ResourceManager.get('cobblestoneNormal'),
							ResourceManager.get('cobblestoneMask'),
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
			},
			depth: {
				depthWrite: false,
				depthCompare: RendererTypes.DepthCompare.LessEqual,
				depthBiasConstant: -1,
				depthBiasSlopeScale: -1
			},
			vertexShaderSource: Shaders.road.vertex,
			fragmentShaderSource: Shaders.road.fragment
		});
	}
}
