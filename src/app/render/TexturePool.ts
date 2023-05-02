import AbstractTexture from "~/lib/renderer/abstract-renderer/AbstractTexture";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import createInstanceTexture from "~/app/render/textures/createInstanceTexture";
import createTreeTexture from "~/app/render/textures/createTreeTexture";
import createProjectedMeshTexture from "~/app/render/textures/createProjectedMeshTexture";
import createExtrudedMeshTexture from "~/app/render/textures/createExtrudedMeshTexture";
import createAircraftTexture from "~/app/render/textures/createAircraftTexture";

export default class TexturePool {
	private textures: Map<string, AbstractTexture> = new Map();

	public constructor(renderer: AbstractRenderer) {
		this.textures.set('instance', createInstanceTexture(renderer));
		this.textures.set('tree', createTreeTexture(renderer));
		this.textures.set('projectedMesh', createProjectedMeshTexture(renderer));
		this.textures.set('extrudedMesh', createExtrudedMeshTexture(renderer));
		this.textures.set('aircraft', createAircraftTexture(renderer));
	}

	public get(name: string): AbstractTexture {
		return this.textures.get(name);
	}
}