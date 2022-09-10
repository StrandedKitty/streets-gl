import AbstractTexture from "~/renderer/abstract-renderer/AbstractTexture";
import {RendererTypes} from "~/renderer/RendererTypes";

export interface ColorClearValue {
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface Attachment {
	texture: AbstractTexture;
	slice?: number;
	loadOp: RendererTypes.AttachmentLoadOp;
	storeOp: RendererTypes.AttachmentStoreOp;
}

export interface ColorAttachment extends Attachment {
	clearValue: ColorClearValue;
}

export interface DepthAttachment extends Attachment {
	clearValue: number;
}

export interface AbstractRenderPassParams {
	colorAttachments: ColorAttachment[];
	depthAttachment?: DepthAttachment;
}

export default interface AbstractRenderPass {
	colorAttachments: ColorAttachment[];
	depthAttachment: DepthAttachment;
	copyColorAttachmentToTexture(attachmentId: number, texture: AbstractTexture): void;
	copyAttachmentsToRenderPass(params: {
		destination: AbstractRenderPass;
		sourceColorAttachment?: number;
		targetColorAttachment?: number;
		copyColor?: boolean;
		copyDepth?: boolean;
	}): void;
	readColorAttachmentPixel<T extends TypedArray>(attachmentId: number, buffer: T, x: number, y: number, width?: number, height?: number): Promise<void>;
	clearAttachments(colorAttachmentIds: number[], clearDepth: boolean): void;
	setSize(width: number, height: number): void;
	delete(): void;
}