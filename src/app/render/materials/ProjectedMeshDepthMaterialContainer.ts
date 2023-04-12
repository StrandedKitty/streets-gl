import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import ResourceLoader from "../../world/ResourceLoader";
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
							ResourceLoader.get('pavementDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('asphaltDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('cobblestoneDiffuse'),
							ResourceLoader.get('cobblestoneNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('footballPitchDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('basketballPitchDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('tennisPitchDiffuse'),
							ResourceLoader.get('tennisPitchNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('manicuredGrassDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('cyclewayDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('railwayDiffuse'),
							ResourceLoader.get('railwayNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('rockDiffuse'),
							ResourceLoader.get('rockNormal'),
							ResourceLoader.get('rockMask'),

							ResourceLoader.get('sandDiffuse'),
							ResourceLoader.get('sandNormal'),
							ResourceLoader.get('sandMask'),

							ResourceLoader.get('hedgeDiffuse'),
							ResourceLoader.get('hedgeNormal'),
							ResourceLoader.get('hedgeMask'),

							ResourceLoader.get('woodFenceDiffuse'),
							ResourceLoader.get('woodFenceNormal'),
							ResourceLoader.get('woodFenceMask'),

							ResourceLoader.get('concreteFenceDiffuse'),
							ResourceLoader.get('concreteFenceNormal'),
							ResourceLoader.get('concreteFenceMask'),
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
