import * as RG from '~/render-graph';
import TextureResourceDescriptor from "~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor";
import {PhysicalResourceBuilder} from "../../../../render-graph";

export default class TextureResource extends RG.Resource {
	constructor(name: string, descriptor: TextureResourceDescriptor, physicalResourceBuilder: PhysicalResourceBuilder, isTransient: boolean, isUsedExternally: boolean) {
		super({
			name,
			descriptor,
			physicalResourceBuilder,
			isTransient,
			isUsedExternally
		});
	}
}