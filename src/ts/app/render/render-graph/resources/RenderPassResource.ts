import * as RG from "~/render-graph";
import RenderPassResourceDescriptor from "~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor";
import RenderPassPhysicalResourceBuilder
	from "~/app/render/render-graph/physical-resource-builders/RenderPassPhysicalResourceBuilder";

export default class RenderPassResource extends RG.Resource<RenderPassResourceDescriptor, RenderPassPhysicalResourceBuilder> {
    constructor(name: string, descriptor: RenderPassResourceDescriptor, physicalResourceBuilder: RenderPassPhysicalResourceBuilder, isTransient: boolean, isUsedExternally: boolean) {
        super({
            name,
            descriptor,
            physicalResourceBuilder,
            isTransient,
            isUsedExternally
        });
    }
}