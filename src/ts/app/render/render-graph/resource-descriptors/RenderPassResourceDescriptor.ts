import * as RG from "~/render-graph";
import TextureResourceDescriptor from "./TextureResourceDescriptor";
import {ColorClearValue} from "~/renderer/abstract-renderer/AbstractRenderPass";
import {RendererTypes} from "~/renderer/RendererTypes";

export interface AttachmentDescriptor {
	texture: TextureResourceDescriptor;
	slice?: number;
	loadOp: RendererTypes.AttachmentLoadOp;
	storeOp: RendererTypes.AttachmentStoreOp;
}

export interface ColorAttachmentDescriptor extends AttachmentDescriptor {
	clearValue: ColorClearValue;
}

export interface DepthAttachmentDescriptor extends AttachmentDescriptor {
	clearValue: number;
}

export default class RenderPassResourceDescriptor extends RG.ResourceDescriptor {
	public colorAttachments: ColorAttachmentDescriptor[];
	public depthAttachment: DepthAttachmentDescriptor;

	constructor(
		{
			colorAttachments,
			depthAttachment = null
		}: {
			colorAttachments: ColorAttachmentDescriptor[];
			depthAttachment?: DepthAttachmentDescriptor;
		}
	) {
		super();

		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;
	}

	private deserializeAttachment(attachment: AttachmentDescriptor) {
		if (!attachment) {
			return null;
		}

		return {...attachment, texture: attachment.texture.deserialize()};
	}

	public memorySize(): number {
		return 0;
	}

	public deserialize(): string {
		const color = this.colorAttachments.map(a => this.deserializeAttachment(a));
		const depth = this.deserializeAttachment(this.depthAttachment);

		return JSON.stringify([color, depth]);
	}
}