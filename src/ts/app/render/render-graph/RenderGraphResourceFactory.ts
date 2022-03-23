import TexturePhysicalResourceBuilder
	from "~/app/render/render-graph/physical-resource-builders/TexturePhysicalResourceBuilder";
import RenderPassPhysicalResourceBuilder
	from "~/app/render/render-graph/physical-resource-builders/RenderPassPhysicalResourceBuilder";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import TextureResource from "~/app/render/render-graph/resources/TextureResource";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import TextureResourceDescriptor from "~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor";
import RenderPassResourceDescriptor from "~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor";

export default class RenderGraphResourceFactory {
	private readonly textureBuilder: TexturePhysicalResourceBuilder;
	private readonly renderPassBuilder: RenderPassPhysicalResourceBuilder;

	constructor(renderer: AbstractRenderer) {
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
			name: string,
			descriptor: TextureResourceDescriptor,
			isTransient: boolean,
			isUsedExternally: boolean
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
			name: string,
			descriptor: RenderPassResourceDescriptor,
			isTransient: boolean,
			isUsedExternally: boolean
		}
	): RenderPassResource {
		return new RenderPassResource(name, descriptor, this.renderPassBuilder, isTransient, isUsedExternally);
	}
}