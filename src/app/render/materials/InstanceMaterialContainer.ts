import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import ResourceManager from "../../world/ResourceManager";

export default class InstanceMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Instance material',
			uniforms: [
				{
					name: 'modelMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'viewMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'textureId',
					block: 'PerInstanceType',
					type: RendererTypes.UniformType.Float1,
					value: new Float32Array(1)
				}, {
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 11 * 2,
						anisotropy: 16,
						data: [
							ResourceManager.get('adColumnDiffuse'),
							ResourceManager.get('adColumnNormal'),

							ResourceManager.get('transmissionTowerDiffuse'),
							ResourceManager.get('transmissionTowerNormal'),

							ResourceManager.get('hydrantDiffuse'),
							ResourceManager.get('hydrantNormal'),

							ResourceManager.get('trackedCraneDiffuse'),
							ResourceManager.get('trackedCraneNormal'),

							ResourceManager.get('towerCraneDiffuse'),
							ResourceManager.get('towerCraneNormal'),

							ResourceManager.get('benchDiffuse'),
							ResourceManager.get('benchNormal'),

							ResourceManager.get('picnicTableDiffuse'),
							ResourceManager.get('picnicTableNormal'),

							ResourceManager.get('busStopDiffuse'),
							ResourceManager.get('busStopNormal'),

							ResourceManager.get('windTurbineDiffuse'),
							ResourceManager.get('windTurbineNormal'),

							ResourceManager.get('memorialDiffuse'),
							ResourceManager.get('memorialNormal'),

							ResourceManager.get('statue0Diffuse'),
							ResourceManager.get('statue0Normal'),
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
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			blend: {
				color: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				},
				alpha: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				}
			},
			vertexShaderSource: Shaders.instance.vertex,
			fragmentShaderSource: Shaders.instance.fragment
		});
	}
}
