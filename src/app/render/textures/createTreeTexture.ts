import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default function createTreeTexture(renderer: AbstractRenderer): AbstractTexture2DArray {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 5 * 2,
		anisotropy: 16,
		data: [
			ResourceLoader.get('treeBeechDiffuse'),
			ResourceLoader.get('treeBeechNormal'),

			ResourceLoader.get('treeFirDiffuse'),
			ResourceLoader.get('treeFirNormal'),

			ResourceLoader.get('treeLinden0Diffuse'),
			ResourceLoader.get('treeLinden0Normal'),

			ResourceLoader.get('treeLinden1Diffuse'),
			ResourceLoader.get('treeLinden1Normal'),

			ResourceLoader.get('treeOakDiffuse'),
			ResourceLoader.get('treeOakNormal'),
		],
		minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter: RendererTypes.MagFilter.Linear,
		wrap: RendererTypes.TextureWrap.Repeat,
		format: RendererTypes.TextureFormat.RGBA8Unorm,
		mipmaps: true
	});
}