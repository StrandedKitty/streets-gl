import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {AircraftPartType} from "~/app/vehicles/aircraft/Aircraft";

export const AircraftPartTextures: Record<AircraftPartType, number> = {
	[AircraftPartType.B777Body]: 0,
	[AircraftPartType.A321Body]: 1,
	[AircraftPartType.Cessna208Body]: 2,
	[AircraftPartType.ERJ135Body]: 3,
	[AircraftPartType.HelicopterBody]: 4,
	[AircraftPartType.HelicopterRotorStatic]: 5,
	[AircraftPartType.HelicopterTailRotorStatic]: 5,
	[AircraftPartType.HelicopterRotorSpinning]: 5,
	[AircraftPartType.HelicopterTailRotorSpinning]: 5
};

export default function createAircraftTexture(renderer: AbstractRenderer): AbstractTexture2DArray {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 6 * 2,
		anisotropy: 16,
		data: [
			ResourceLoader.get('aircraftB777Diffuse'),
			ResourceLoader.get('aircraftB777Normal'),

			ResourceLoader.get('aircraftA321Diffuse'),
			ResourceLoader.get('aircraftA321Normal'),

			ResourceLoader.get('aircraftCessna208Diffuse'),
			ResourceLoader.get('aircraftCessna208Normal'),

			ResourceLoader.get('aircraftERJ135Diffuse'),
			ResourceLoader.get('aircraftERJ135Normal'),

			ResourceLoader.get('aircraftHeliBodyDiffuse'),
			ResourceLoader.get('aircraftHeliBodyNormal'),

			ResourceLoader.get('aircraftHeliRotorDiffuse'),
			ResourceLoader.get('aircraftHeliRotorNormal'),
		],
		minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter: RendererTypes.MagFilter.Linear,
		wrap: RendererTypes.TextureWrap.Repeat,
		format: RendererTypes.TextureFormat.RGBA8Unorm,
		mipmaps: true
	});
}