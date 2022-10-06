import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import ResourceManager from "~/app/world/ResourceManager";

export default class ShadingMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Shading material',
			uniforms: [
				{
					name: 'tColor',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tPosition',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tShadowMaps',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: null
				}, {
					name: 'tSSAO',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionMask',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionBlurred',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSky',
					block: null,
					type: RendererTypes.UniformType.TextureCube,
					value: this.renderer.createTextureCube({
						width: 512,
						height: 512,
						anisotropy: 16,
						data: [
							ResourceManager.get('sky0'),
							ResourceManager.get('sky1'),
							ResourceManager.get('sky2'),
							ResourceManager.get('sky3'),
							ResourceManager.get('sky4'),
							ResourceManager.get('sky5'),
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.ClampToEdge,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}, {
					name: 'viewMatrix',
					block: null,
					type: RendererTypes.UniformType.Matrix4,
					value: null
				}, {
					name: 'CSMSplits[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array()
				}, {
					name: 'CSMLightDirectionAndIntensity[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMResolution[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMSize[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMBias[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMMatrixWorldInverse[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMFadeOffset[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: false,
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
			vertexShaderSource: Shaders.shading.vertex,
			fragmentShaderSource: Shaders.shading.fragment
		});
	}
}
