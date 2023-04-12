import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import ResourceLoader from "../../world/ResourceLoader";

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
						depth: 12 * 2,
						anisotropy: 16,
						data: [
							ResourceLoader.get('adColumnDiffuse'),
							ResourceLoader.get('adColumnNormal'),

							ResourceLoader.get('transmissionTowerDiffuse'),
							ResourceLoader.get('transmissionTowerNormal'),

							ResourceLoader.get('hydrantDiffuse'),
							ResourceLoader.get('hydrantNormal'),

							ResourceLoader.get('trackedCraneDiffuse'),
							ResourceLoader.get('trackedCraneNormal'),

							ResourceLoader.get('towerCraneDiffuse'),
							ResourceLoader.get('towerCraneNormal'),

							ResourceLoader.get('benchDiffuse'),
							ResourceLoader.get('benchNormal'),

							ResourceLoader.get('picnicTableDiffuse'),
							ResourceLoader.get('picnicTableNormal'),

							ResourceLoader.get('busStopDiffuse'),
							ResourceLoader.get('busStopNormal'),

							ResourceLoader.get('windTurbineDiffuse'),
							ResourceLoader.get('windTurbineNormal'),

							ResourceLoader.get('memorialDiffuse'),
							ResourceLoader.get('memorialNormal'),

							ResourceLoader.get('statue0Diffuse'),
							ResourceLoader.get('statue0Normal'),

							ResourceLoader.get('shrubberyDiffuse'),
							ResourceLoader.get('shrubberyNormal'),
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
