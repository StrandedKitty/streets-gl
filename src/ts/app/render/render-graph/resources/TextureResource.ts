import TextureResourceDescriptor from "~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor";
import * as RG from "~/render-graph";
import TexturePhysicalResourceBuilder
	from "~/app/render/render-graph/physical-resource-builders/TexturePhysicalResourceBuilder";

export default class TextureResource extends RG.Resource<TextureResourceDescriptor, TexturePhysicalResourceBuilder> {
	public constructor(name: string, descriptor: TextureResourceDescriptor, physicalResourceBuilder: TexturePhysicalResourceBuilder, isTransient: boolean, isUsedExternally: boolean) {
		super({
			name,
			descriptor,
			physicalResourceBuilder,
			isTransient,
			isUsedExternally
		});
	}
}