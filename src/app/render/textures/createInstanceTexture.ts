import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";

export const InstanceTextureIdList: Record<Tile3DInstanceType, number> = {
	tree: -1,
	adColumn: 0,
	transmissionTower: 1,
	hydrant: 2,
	trackedCrane: 3,
	towerCrane: 4,
	bench: 5,
	picnicTable: 6,
	busStop: 7,
	windTurbine: 8,
	memorial: 9,
	statue: 10,
	shrubbery: 11,
	utilityPole: 12,
	wire: 13
};

export default function createInstanceTexture(renderer: AbstractRenderer): AbstractTexture2DArray {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 14 * 2,
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

			ResourceLoader.get('utilityPoleDiffuse'),
			ResourceLoader.get('utilityPoleNormal'),

			ResourceLoader.get('wireDiffuse'),
			ResourceLoader.get('wireNormal'),
		],
		minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter: RendererTypes.MagFilter.Linear,
		wrap: RendererTypes.TextureWrap.Repeat,
		format: RendererTypes.TextureFormat.RGBA8Unorm,
		mipmaps: true
	});
}