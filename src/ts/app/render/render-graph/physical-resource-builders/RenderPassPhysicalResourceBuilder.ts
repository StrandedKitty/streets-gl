import * as RG from "~/render-graph";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import RenderPassResourceDescriptor from "~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor";
import TexturePhysicalResourceBuilder
    from "~/app/render/render-graph/physical-resource-builders/TexturePhysicalResourceBuilder";
import {ColorAttachment} from "~/renderer/abstract-renderer/AbstractRenderPass";

export default class RenderPassPhysicalResourceBuilder extends RG.PhysicalResourceBuilder {
    private renderer: AbstractRenderer;
    private textureBuilder: TexturePhysicalResourceBuilder;

    constructor(renderer: AbstractRenderer, textureBuilder: TexturePhysicalResourceBuilder) {
        super();
        this.renderer = renderer;
        this.textureBuilder = textureBuilder;
    }

    public createFromResourceDescriptor(descriptor: RenderPassResourceDescriptor): RG.PhysicalResource {
        const colorAttachments: ColorAttachment[] = descriptor.colorAttachments.map(attachment => {
            return {
                ...attachment,
                texture: this.textureBuilder.createFromResourceDescriptor(attachment.texture)
            };
        });
        const depthAttachment = descriptor.depthAttachment ? {
            ...descriptor.depthAttachment,
            texture: this.textureBuilder.createFromResourceDescriptor(descriptor.depthAttachment.texture)
        } : null;

        return this.renderer.createRenderPass({
            colorAttachments,
            depthAttachment
        });
    }
}