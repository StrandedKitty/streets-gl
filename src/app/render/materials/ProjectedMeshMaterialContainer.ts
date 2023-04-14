import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import ResourceLoader from "../../world/ResourceLoader";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import Config from "../../Config";

export default class ProjectedMeshMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer, isExtruded: boolean) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Projected mesh material',
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
					name: 'time',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Float1,
					value: new Float32Array(1)
				}, {
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 26 * 3,
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
							ResourceLoader.get('commonNormal'),
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

							ResourceLoader.get('asphaltRoadDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('asphaltIntersectionDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('concreteRoadDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('concreteIntersectionDiffuse'),
							ResourceLoader.get('commonNormal'),
							ResourceLoader.get('commonMask'),

							ResourceLoader.get('woodRoadDiffuse'),
							ResourceLoader.get('woodRoadNormal'),
							ResourceLoader.get('woodRoadMask'),

							ResourceLoader.get('helipadDiffuse'),
							ResourceLoader.get('helipadNormal'),
							ResourceLoader.get('helipadMask'),

							ResourceLoader.get('gardenDiffuse'),
							ResourceLoader.get('gardenNormal'),
							ResourceLoader.get('gardenMask'),

							ResourceLoader.get('soilDiffuse'),
							ResourceLoader.get('soilNormal'),
							ResourceLoader.get('soilMask'),

							ResourceLoader.get('grassDiffuse'),
							ResourceLoader.get('grassNormal'),
							ResourceLoader.get('grassMask'),

							ResourceLoader.get('forestFloorDiffuse'),
							ResourceLoader.get('forestFloorNormal'),
							ResourceLoader.get('forestFloorMask'),

							ResourceLoader.get('chainLinkFenceDiffuse'),
							ResourceLoader.get('chainLinkFenceNormal'),
							ResourceLoader.get('chainLinkFenceMask'),

							ResourceLoader.get('metalFenceDiffuse'),
							ResourceLoader.get('metalFenceNormal'),
							ResourceLoader.get('metalFenceMask'),
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true,
						flipY: true
					})
				}, {
					name: 'tWaterNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: this.renderer.createTexture2D({
						anisotropy: 16,
						data: ResourceLoader.get('waterNormal'),
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}, {
					name: 'tRingHeight',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: null
				}, {
					name: 'tNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: null
				}, {
					name: 'transformNormal0',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array(4)
				}, {
					name: 'transformNormal1',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array(4)
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
				}, {
					name: 'cameraPosition',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array(2)
				}
			],
			defines: {
				TILE_SIZE: Config.TileSize.toFixed(10),
				NORMAL_MIX_FROM: Config.TerrainNormalMixRange[0].toFixed(1),
				NORMAL_MIX_TO: Config.TerrainNormalMixRange[1].toFixed(1),
				IS_EXTRUDED: isExtruded ? '1' : '0'
			},
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: isExtruded ? RendererTypes.CullMode.None : RendererTypes.CullMode.Back
			},
			depth: {
				depthWrite: isExtruded,
				depthCompare: RendererTypes.DepthCompare.LessEqual,
				depthBiasConstant: isExtruded ? undefined : -2,
				depthBiasSlopeScale: isExtruded ? undefined : -1
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
			vertexShaderSource: Shaders.projected.vertex,
			fragmentShaderSource: Shaders.projected.fragment
		});
	}
}
