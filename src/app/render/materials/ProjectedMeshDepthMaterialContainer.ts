import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import ResourceManager from "../../world/ResourceManager";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import Config from "../../Config";

export default class ProjectedMeshDepthMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Projected mesh depth material',
			uniforms: [
				{
					name: 'modelViewMatrix',
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
						depth: 14 * 3,
						anisotropy: 16,
						data: [
							ResourceManager.get('pavementDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('asphaltDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('cobblestoneDiffuse'),
							ResourceManager.get('cobblestoneNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('footballPitchDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('basketballPitchDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('tennisPitchDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('manicuredGrassDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('cyclewayDiffuse'),
							ResourceManager.get('commonNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('railwayDiffuse'),
							ResourceManager.get('railwayNormal'),
							ResourceManager.get('commonMask'),

							ResourceManager.get('rockDiffuse'),
							ResourceManager.get('rockNormal'),
							ResourceManager.get('rockMask'),

							ResourceManager.get('sandDiffuse'),
							ResourceManager.get('sandNormal'),
							ResourceManager.get('sandMask'),

							ResourceManager.get('hedgeDiffuse'),
							ResourceManager.get('hedgeNormal'),
							ResourceManager.get('hedgeMask'),

							ResourceManager.get('woodFenceDiffuse'),
							ResourceManager.get('woodFenceNormal'),
							ResourceManager.get('woodFenceMask'),

							ResourceManager.get('concreteFenceDiffuse'),
							ResourceManager.get('concreteFenceNormal'),
							ResourceManager.get('concreteFenceMask'),
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true,
						flipY: true
					})
				}, {
					name: 'tRingHeight',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: null
				}, {
					name: 'terrainRingSize',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float1,
					value: new Float32Array(1)
				}, {
					name: 'terrainRingOffset',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array(4)
				}, {
					name: 'terrainLevelId',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Int1,
					value: new Int32Array(1)
				}, {
					name: 'segmentCount',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float1,
					value: new Float32Array(1)
				}
			],
			defines: {},
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
			vertexShaderSource: Shaders.projectedDepth.vertex,
			fragmentShaderSource: Shaders.projectedDepth.fragment
		});
	}
}
