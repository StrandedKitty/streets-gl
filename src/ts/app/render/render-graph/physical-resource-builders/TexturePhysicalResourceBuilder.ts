import * as RG from "~/render-graph";
import TextureResourceDescriptor, {
	TextureResourceType
} from "~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture from "~/renderer/abstract-renderer/AbstractTexture";

export default class TexturePhysicalResourceBuilder extends RG.PhysicalResourceBuilder<AbstractTexture> {
	private renderer: AbstractRenderer;

	public constructor(renderer: AbstractRenderer) {
		super();
		this.renderer = renderer;
	}

	public createFromResourceDescriptor(descriptor: TextureResourceDescriptor): AbstractTexture {
		switch (descriptor.type) {
			case TextureResourceType.Texture2D: {
				return this.renderer.createTexture2D({...descriptor});
			}
			case TextureResourceType.TextureCube: {
				return this.renderer.createTextureCube({...descriptor});
			}
			case TextureResourceType.Texture2DArray: {
				return this.renderer.createTexture2DArray({...descriptor});
			}
			case TextureResourceType.Texture3D: {
				return this.renderer.createTexture3D({...descriptor});
			}
		}
	}
}