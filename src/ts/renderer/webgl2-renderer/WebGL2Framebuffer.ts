import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import {ColorAttachment, ColorClearValue, DepthAttachment} from "~/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Texture2DArray from "~/renderer/webgl2-renderer/WebGL2Texture2DArray";
import WebGL2Texture3D from "~/renderer/webgl2-renderer/WebGL2Texture3D";
import WebGL2Texture2D from "~/renderer/webgl2-renderer/WebGL2Texture2D";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractTexture from "~/renderer/abstract-renderer/AbstractTexture";

export default class WebGL2Framebuffer {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly colorAttachments: ColorAttachment[];
	private readonly depthAttachment: DepthAttachment;
	private width: number = 0;
	private height: number = 0;
	private WebGLFramebuffer: WebGLFramebuffer;
	private attachedLayers: {color: number[]; depth: number} = {
		color: [],
		depth: -1
	};

	public constructor(renderer: WebGL2Renderer, colorAttachments: ColorAttachment[], depthAttachment: DepthAttachment) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;

		this.updateDimensionsFromAttachments();

		this.createWebGLFramebuffer();

		this.bindAttachments();
	}

	private updateDimensionsFromAttachments(): void {
		if (this.colorAttachments.length !== 0) {
			this.width = this.colorAttachments[0].texture.width;
			this.height = this.colorAttachments[0].texture.height;
		} else if (this.depthAttachment) {
			this.width = this.depthAttachment.texture.width;
			this.height = this.depthAttachment.texture.height;
		}
	}

	public bind(): void {
		this.updateDimensionsFromAttachments();

		let shouldUpdateAttachments: boolean = false;

		for (let i = 0; i < this.colorAttachments.length; i++) {
			const layer = this.colorAttachments[i].slice;
			const lastLayer = this.attachedLayers.color[i];

			if (layer !== lastLayer) {
				shouldUpdateAttachments = true;
			}
		}

		if (this.depthAttachment) {
			const layer = this.depthAttachment.slice;
			const lastLayer = this.attachedLayers.depth;

			if (layer !== lastLayer) {
				shouldUpdateAttachments = true;
			}
		}

		this.gl.viewport(0, 0, this.width, this.height);
		this.gl.bindFramebuffer(WebGL2Constants.FRAMEBUFFER, this.WebGLFramebuffer);

		if (shouldUpdateAttachments) {
			this.bindAttachments();
		}
	}

	private createWebGLFramebuffer(): void {
		this.WebGLFramebuffer = this.gl.createFramebuffer();
	}

	public bindAttachments(): void {
		this.gl.bindFramebuffer(WebGL2Constants.FRAMEBUFFER, this.WebGLFramebuffer);

		const attachments: number[] = [];

		for (let i = 0; i < this.colorAttachments.length; i++) {
			const attachment = this.colorAttachments[i];

			if (attachment.storeOp === RendererTypes.AttachmentStoreOp.Discard) {
				attachments.push(WebGL2Constants.NONE);
				continue;
			}

			const attachmentConstant = WebGL2Constants.COLOR_ATTACHMENT0 + i;
			const texture = attachment.texture;

			if (texture instanceof WebGL2Texture2DArray || texture instanceof WebGL2Texture3D) {
				this.gl.framebufferTextureLayer(WebGL2Constants.FRAMEBUFFER, attachmentConstant, texture.WebGLTexture, 0, attachment.slice);
				this.attachedLayers.color[i] = attachment.slice;
			} else {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, attachmentConstant, WebGL2Constants.TEXTURE_2D, (<WebGL2Texture2D>texture).WebGLTexture, 0);
			}

			attachments.push(attachmentConstant);
		}

		if (this.depthAttachment) {
			const texture = this.depthAttachment.texture;

			if (texture instanceof WebGL2Texture2DArray || texture instanceof WebGL2Texture3D) {
				this.gl.framebufferTextureLayer(WebGL2Constants.FRAMEBUFFER, WebGL2Constants.DEPTH_ATTACHMENT, texture.WebGLTexture, 0, this.depthAttachment.slice);
				this.attachedLayers.depth = this.depthAttachment.slice;
			} else {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, WebGL2Constants.DEPTH_ATTACHMENT, WebGL2Constants.TEXTURE_2D, (<WebGL2Texture2D>texture).WebGLTexture, 0);
			}
		}

		this.gl.drawBuffers(attachments);
	}

	private buildAttachmentsArray(index: number): number[] {
		const attachments: number[] = [];

		for (let i = 0; i <= index; i++) {
			if (i === index)
				attachments.push(WebGL2Constants.COLOR_ATTACHMENT0 + i);
			else
				attachments.push(WebGL2Constants.NONE);
		}

		return attachments;
	}

	public copyAttachmentsToFramebuffer(
		{
			destination,
			sourceColorAttachment = 0,
			targetColorAttachment = 0,
			copyColor = false,
			copyDepth = false
		}: {
			destination: WebGL2Framebuffer;
			sourceColorAttachment?: number;
			targetColorAttachment?: number;
			copyColor?: boolean;
			copyDepth?: boolean;
		}
	): void {
		this.gl.bindFramebuffer(WebGL2Constants.READ_FRAMEBUFFER, this.WebGLFramebuffer);
		this.gl.bindFramebuffer(WebGL2Constants.DRAW_FRAMEBUFFER, destination.WebGLFramebuffer);

		this.gl.readBuffer(WebGL2Constants.COLOR_ATTACHMENT0 + sourceColorAttachment);
		this.gl.drawBuffers(this.buildAttachmentsArray(targetColorAttachment));

		if (copyColor) {
			this.gl.blitFramebuffer(
				0, 0, this.width, this.height,
				0, 0, destination.width, destination.height,
				WebGL2Constants.COLOR_BUFFER_BIT, WebGL2Constants.NEAREST
			);
		}

		if (copyDepth) {
			this.gl.blitFramebuffer(
				0, 0, this.width, this.height,
				0, 0, destination.width, destination.height,
				WebGL2Constants.DEPTH_BUFFER_BIT, WebGL2Constants.NEAREST
			);
		}

		this.gl.bindFramebuffer(WebGL2Constants.READ_FRAMEBUFFER, null);
		this.gl.bindFramebuffer(WebGL2Constants.DRAW_FRAMEBUFFER, null);
	}

	public clear(): void {
		for (let i = 0; i < this.colorAttachments.length; i++) {
			const attachment = this.colorAttachments[i];

			if (attachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
				this.clearColorBuffer(attachment.texture, attachment.clearValue, i);
			}
		}

		if (this.depthAttachment && this.depthAttachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
			const depthWriteEnabled = this.renderer.depthWrite;

			if (!depthWriteEnabled) {
				this.renderer.depthWrite = true;
			}

			this.gl.clearBufferfi(WebGL2Constants.DEPTH_STENCIL, 0, this.depthAttachment.clearValue, 0);

			if (!depthWriteEnabled) {
				this.renderer.depthWrite = false;
			}
		}
	}

	private clearColorBuffer(texture: AbstractTexture, clearValue: ColorClearValue, drawBuffer: number): void {
		switch (texture.format) {
			case RendererTypes.TextureFormat.RGBA8Unorm:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
		}
	}

	private static clearValueToTypedArray<T extends TypedArray>(type: {new(arr: number[]): T}, clearValue: ColorClearValue): T {
		return new type([clearValue.r, clearValue.g, clearValue.b, clearValue.a]);
	}

	public delete(): void {
		this.renderer.gl.deleteFramebuffer(this.WebGLFramebuffer);
	}
}