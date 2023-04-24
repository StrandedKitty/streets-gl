import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default function createExtrudedMeshTexture(renderer: AbstractRenderer): AbstractTexture2DArray {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 21 * 4,
		anisotropy: 16,
		data: [
			ResourceLoader.get('roofGeneric1Diffuse'),
			ResourceLoader.get('roofGeneric1Normal'),
			ResourceLoader.get('roofCommonMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofGeneric2Diffuse'),
			ResourceLoader.get('roofGeneric2Normal'),
			ResourceLoader.get('roofCommonMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofGeneric3Diffuse'),
			ResourceLoader.get('roofGeneric3Normal'),
			ResourceLoader.get('roofCommonMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofGeneric4Diffuse'),
			ResourceLoader.get('roofGeneric4Normal'),
			ResourceLoader.get('roofCommonMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofTilesDiffuse'),
			ResourceLoader.get('roofTilesNormal'),
			ResourceLoader.get('roofTilesMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofMetalDiffuse'),
			ResourceLoader.get('roofMetalNormal'),
			ResourceLoader.get('roofMetalMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofConcreteDiffuse'),
			ResourceLoader.get('roofConcreteNormal'),
			ResourceLoader.get('roofConcreteMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofThatchDiffuse'),
			ResourceLoader.get('roofThatchNormal'),
			ResourceLoader.get('roofThatchMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofEternitDiffuse'),
			ResourceLoader.get('roofEternitNormal'),
			ResourceLoader.get('roofEternitMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofGrassDiffuse'),
			ResourceLoader.get('roofGrassNormal'),
			ResourceLoader.get('roofGrassMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofGlassDiffuse'),
			ResourceLoader.get('roofGlassNormal'),
			ResourceLoader.get('roofGlassMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('roofTarDiffuse'),
			ResourceLoader.get('roofTarNormal'),
			ResourceLoader.get('roofTarMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('facadeGlassDiffuse'),
			ResourceLoader.get('facadeGlassNormal'),
			ResourceLoader.get('facadeGlassMask'),
			ResourceLoader.get('glassGlow'),

			ResourceLoader.get('facadeBrickWallDiffuse'),
			ResourceLoader.get('facadeBrickWallNormal'),
			ResourceLoader.get('facadeBrickWallMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('facadeBrickWindowDiffuse'),
			ResourceLoader.get('facadeBrickWindowNormal'),
			ResourceLoader.get('facadeBrickWindowMask'),
			ResourceLoader.get('window0Glow'),

			ResourceLoader.get('facadePlasterWallDiffuse'),
			ResourceLoader.get('facadePlasterWallNormal'),
			ResourceLoader.get('facadePlasterWallMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('facadePlasterWindowDiffuse'),
			ResourceLoader.get('facadePlasterWindowNormal'),
			ResourceLoader.get('facadePlasterWindowMask'),
			ResourceLoader.get('window1Glow'),

			ResourceLoader.get('facadeWoodWallDiffuse'),
			ResourceLoader.get('facadeWoodWallNormal'),
			ResourceLoader.get('facadeWoodWallMask'),
			ResourceLoader.get('noGlow'),

			ResourceLoader.get('facadeWoodWindowDiffuse'),
			ResourceLoader.get('facadeWoodWindowNormal'),
			ResourceLoader.get('facadeWoodWindowMask'),
			ResourceLoader.get('window0Glow'),

			ResourceLoader.get('facadeBlockWallDiffuse'),
			ResourceLoader.get('facadeBlockWallNormal'),
			ResourceLoader.get('facadeBlockWallMask'),
			ResourceLoader.get('window0Glow'),

			ResourceLoader.get('facadeBlockWindowDiffuse'),
			ResourceLoader.get('facadeBlockWindowNormal'),
			ResourceLoader.get('facadeBlockWindowMask'),
			ResourceLoader.get('window1Glow'),

		],
		minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter: RendererTypes.MagFilter.Linear,
		wrap: RendererTypes.TextureWrap.Repeat,
		format: RendererTypes.TextureFormat.RGBA8Unorm,
		mipmaps: true,
		flipY: true
	})
}