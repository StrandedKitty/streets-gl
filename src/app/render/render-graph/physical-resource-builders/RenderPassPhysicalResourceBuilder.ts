import * as RG from "~/lib/render-graph";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import RenderPassResourceDescriptor from "../resource-descriptors/RenderPassResourceDescriptor";
import TexturePhysicalResourceBuilder
	from "./TexturePhysicalResourceBuilder";
import AbstractRenderPass, {ColorAttachment} from "~/lib/renderer/abstract-renderer/AbstractRenderPass";

export default class RenderPassPhysicalResourceBuilder extends RG.PhysicalResourceBuilder<AbstractRenderPass> {
	private renderer: AbstractRenderer;
	private textureBuilder: TexturePhysicalResourceBuilder;

	public constructor(renderer: AbstractRenderer, textureBuilder: TexturePhysicalResourceBuilder) {
		super();
		this.renderer = renderer;
		this.textureBuilder = textureBuilder;
	}

	public createFromResourceDescriptor(descriptor: RenderPassResourceDescriptor): AbstractRenderPass {
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