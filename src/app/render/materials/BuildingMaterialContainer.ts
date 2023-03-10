import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import ResourceManager from "../../world/ResourceManager";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class BuildingMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Building material',
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
					name: 'tileId',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Uint1,
					value: new Uint32Array(1)
				}, {
					name: 'projectionMatrix',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'tRoof',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 13 * 3,
						anisotropy: 16,
						data: [
							ResourceManager.get('roofGeneric1Diffuse'),
							ResourceManager.get('roofGeneric1Normal'),
							ResourceManager.get('roofCommonMask'),

							ResourceManager.get('roofGeneric2Diffuse'),
							ResourceManager.get('roofGeneric2Normal'),
							ResourceManager.get('roofCommonMask'),

							ResourceManager.get('roofGeneric3Diffuse'),
							ResourceManager.get('roofGeneric3Normal'),
							ResourceManager.get('roofCommonMask'),

							ResourceManager.get('roofGeneric4Diffuse'),
							ResourceManager.get('roofGeneric4Normal'),
							ResourceManager.get('roofCommonMask'),

							ResourceManager.get('roofTilesDiffuse'),
							ResourceManager.get('roofTilesNormal'),
							ResourceManager.get('roofTilesMask'),

							ResourceManager.get('roofMetalDiffuse'),
							ResourceManager.get('roofMetalNormal'),
							ResourceManager.get('roofMetalMask'),

							ResourceManager.get('roofConcreteDiffuse'),
							ResourceManager.get('roofConcreteNormal'),
							ResourceManager.get('roofConcreteMask'),

							ResourceManager.get('roofThatchDiffuse'),
							ResourceManager.get('roofThatchNormal'),
							ResourceManager.get('roofThatchMask'),

							ResourceManager.get('roofEternitDiffuse'),
							ResourceManager.get('roofEternitNormal'),
							ResourceManager.get('roofEternitMask'),

							ResourceManager.get('roofGrassDiffuse'),
							ResourceManager.get('roofGrassNormal'),
							ResourceManager.get('roofGrassMask'),

							ResourceManager.get('roofGlassDiffuse'),
							ResourceManager.get('roofGlassNormal'),
							ResourceManager.get('roofGlassMask'),

							ResourceManager.get('roofTarDiffuse'),
							ResourceManager.get('roofTarNormal'),
							ResourceManager.get('roofTarMask'),

							ResourceManager.get('facadePlaceholderDiffuse'),
							ResourceManager.get('facadePlaceholderNormal'),
							ResourceManager.get('facadePlaceholderMask')
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true,
						flipY: true
					})
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
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
			vertexShaderSource: Shaders.building.vertex,
			fragmentShaderSource: Shaders.building.fragment
		});
	}
}
