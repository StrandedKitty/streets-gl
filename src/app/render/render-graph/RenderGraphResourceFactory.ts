import TexturePhysicalResourceBuilder
	from "./physical-resource-builders/TexturePhysicalResourceBuilder";
import RenderPassPhysicalResourceBuilder
	from "./physical-resource-builders/RenderPassPhysicalResourceBuilder";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import TextureResource from "./resources/TextureResource";
import RenderPassResource from "./resources/RenderPassResource";
import TextureResourceDescriptor from "./resource-descriptors/TextureResourceDescriptor";
import RenderPassResourceDescriptor from "./resource-descriptors/RenderPassResourceDescriptor";

export default class RenderGraphResourceFactory {
	private readonly textureBuilder: TexturePhysicalResourceBuilder;
	private readonly renderPassBuilder: RenderPassPhysicalResourceBuilder;

	public constructor(renderer: AbstractRenderer) {
		this.textureBuilder = new TexturePhysicalResourceBuilder(renderer);
		this.renderPassBuilder = new RenderPassPhysicalResourceBuilder(renderer, this.textureBuilder);
	}

	public createTextureResource(
		{
			name,
			descriptor,
			isTransient,
			isUsedExternally
		}: {
			name: string;
			descriptor: TextureResourceDescriptor;
			isTransient: boolean;
			isUsedExternally: boolean;
		}
	): TextureResource {
		return new TextureResource(name, descriptor, this.textureBuilder, isTransient, isUsedExternally);
	}

	public createRenderPassResource(
		{
			name,
			descriptor,
			isTransient,
			isUsedExternally
		}: {
			name: string;
			descriptor: RenderPassResourceDescriptor;
			isTransient: boolean;
			isUsedExternally: boolean;
		}
	): RenderPassResource {
		return new RenderPassResource(name, descriptor, this.renderPassBuilder, isTransient, isUsedExternally);
	}
}