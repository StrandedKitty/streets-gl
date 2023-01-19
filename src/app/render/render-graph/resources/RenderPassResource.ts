import * as RG from "~/lib/render-graph";
import RenderPassResourceDescriptor from "../resource-descriptors/RenderPassResourceDescriptor";
import RenderPassPhysicalResourceBuilder
	from "../physical-resource-builders/RenderPassPhysicalResourceBuilder";

export default class RenderPassResource extends RG.Resource<RenderPassResourceDescriptor, RenderPassPhysicalResourceBuilder> {
	public constructor(name: string, descriptor: RenderPassResourceDescriptor, physicalResourceBuilder: RenderPassPhysicalResourceBuilder, isTransient: boolean, isUsedExternally: boolean) {
		super({
			name,
			descriptor,
			physicalResourceBuilder,
			isTransient,
			isUsedExternally
		});
	}
}