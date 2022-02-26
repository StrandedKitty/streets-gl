import ResourceDescriptor from "~/render-graph/ResourceDescriptor";
import TextureResourceDescriptor from "./TextureResourceDescriptor";

export default class FrameResourceDescriptor extends ResourceDescriptor {
	public textures: TextureResourceDescriptor[];

	constructor(
		{
			textures
		}: {
			textures: TextureResourceDescriptor[]
		}
	) {
		super();

		this.textures = textures;
	}

	public memorySize(): number {
		return 0;
	}

	public deserialize(): string {
		return JSON.stringify(this.textures.map(texture => texture.deserialize()));
	}
}