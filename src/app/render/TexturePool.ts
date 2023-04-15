import AbstractTexture from "~/lib/renderer/abstract-renderer/AbstractTexture";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import createInstanceTexture from "~/app/render/textures/createInstanceTexture";
import createTreeTexture from "~/app/render/textures/createTreeTexture";

export default class TexturePool {
	private textures: Map<string, AbstractTexture> = new Map();

	public constructor(renderer: AbstractRenderer) {
		this.textures.set('instance', createInstanceTexture(renderer));
		this.textures.set('tree', createTreeTexture(renderer));
	}

	public get(name: string): AbstractTexture {
		return this.textures.get(name);
	}
}