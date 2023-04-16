import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default function createExtrudedMeshTexture(renderer: AbstractRenderer): AbstractTexture2DArray {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 18 * 3,
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

			ResourceLoader.get('facadeGlassDiffuse'),
			ResourceLoader.get('facadeGlassNormal'),
			ResourceLoader.get('facadeGlassMask'),

			ResourceLoader.get('facadeBrickWallDiffuse'),
			ResourceLoader.get('facadeBrickWallNormal'),
			ResourceLoader.get('facadeBrickWallMask'),

			ResourceLoader.get('facadeBrickWindowDiffuse'),
			ResourceLoader.get('facadeBrickWindowNormal'),
			ResourceLoader.get('facadeBrickWindowMask'),

			ResourceLoader.get('facadePlasterWallDiffuse'),
			ResourceLoader.get('facadePlasterWallNormal'),
			ResourceLoader.get('facadePlasterWallMask'),

			ResourceLoader.get('facadePlasterWindowDiffuse'),
			ResourceLoader.get('facadePlasterWindowNormal'),
			ResourceLoader.get('facadePlasterWindowMask'),

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