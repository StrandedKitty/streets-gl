import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import ResourceLoader from "../../world/ResourceLoader";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class ExtrudedMeshMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Extruded mesh material',
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
							ResourceLoader.get('roofGeneric1Diffuse'),
							ResourceLoader.get('roofGeneric1Normal'),
							ResourceLoader.get('roofCommonMask'),

							ResourceLoader.get('roofGeneric2Diffuse'),
							ResourceLoader.get('roofGeneric2Normal'),
							ResourceLoader.get('roofCommonMask'),

							ResourceLoader.get('roofGeneric3Diffuse'),
							ResourceLoader.get('roofGeneric3Normal'),
							ResourceLoader.get('roofCommonMask'),

							ResourceLoader.get('roofGeneric4Diffuse'),
							ResourceLoader.get('roofGeneric4Normal'),
							ResourceLoader.get('roofCommonMask'),

							ResourceLoader.get('roofTilesDiffuse'),
							ResourceLoader.get('roofTilesNormal'),
							ResourceLoader.get('roofTilesMask'),

							ResourceLoader.get('roofMetalDiffuse'),
							ResourceLoader.get('roofMetalNormal'),
							ResourceLoader.get('roofMetalMask'),

							ResourceLoader.get('roofConcreteDiffuse'),
							ResourceLoader.get('roofConcreteNormal'),
							ResourceLoader.get('roofConcreteMask'),

							ResourceLoader.get('roofThatchDiffuse'),
							ResourceLoader.get('roofThatchNormal'),
							ResourceLoader.get('roofThatchMask'),

							ResourceLoader.get('roofEternitDiffuse'),
							ResourceLoader.get('roofEternitNormal'),
							ResourceLoader.get('roofEternitMask'),

							ResourceLoader.get('roofGrassDiffuse'),
							ResourceLoader.get('roofGrassNormal'),
							ResourceLoader.get('roofGrassMask'),

							ResourceLoader.get('roofGlassDiffuse'),
							ResourceLoader.get('roofGlassNormal'),
							ResourceLoader.get('roofGlassMask'),

							ResourceLoader.get('roofTarDiffuse'),
							ResourceLoader.get('roofTarNormal'),
							ResourceLoader.get('roofTarMask'),

							ResourceLoader.get('facadePlaceholderDiffuse'),
							ResourceLoader.get('facadePlaceholderNormal'),
							ResourceLoader.get('facadePlaceholderMask')
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
			vertexShaderSource: Shaders.extruded.vertex,
			fragmentShaderSource: Shaders.extruded.fragment
		});
	}
}
