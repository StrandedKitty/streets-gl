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
	private colorAttachments: ColorAttachment[];
	private depthAttachment: DepthAttachment;
	private width: number = 0;
	private height: number = 0;
	private WebGLFramebuffer: WebGLFramebuffer;

	constructor(renderer: WebGL2Renderer, colorAttachments: ColorAttachment[], depthAttachment: DepthAttachment) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;

		this.createWebGLFramebuffer();

		this.bindAttachments();
	}

	public bind() {
		if (this.colorAttachments.length !== 0) {
			this.width = this.colorAttachments[0].texture.width;
			this.height = this.colorAttachments[0].texture.height;
		} else {
			throw new Error();
		}

		this.gl.viewport(0, 0, this.width, this.height);
		this.gl.bindFramebuffer(WebGL2Constants.FRAMEBUFFER, this.WebGLFramebuffer);
	}

	private createWebGLFramebuffer() {
		this.WebGLFramebuffer = this.gl.createFramebuffer();
	}

	public bindAttachments() {
		this.bind();

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
				this.renderer.gl.framebufferTextureLayer(WebGL2Constants.FRAMEBUFFER, attachmentConstant, texture.WebGLTexture, 0, attachment.slice);
			} else {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, attachmentConstant, WebGL2Constants.TEXTURE_2D, (<WebGL2Texture2D>texture).WebGLTexture, 0);
			}

			attachments.push(attachmentConstant);
		}

		if (this.depthAttachment) {
			const texture = <WebGL2Texture2D>this.depthAttachment.texture;

			this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, WebGL2Constants.DEPTH_ATTACHMENT, WebGL2Constants.TEXTURE_2D, texture.WebGLTexture, 0);
		}

		this.gl.drawBuffers(attachments);
	}

	public clear() {
		for (let i = 0; i < this.colorAttachments.length; i++) {
			const attachment = this.colorAttachments[i];

			if (attachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
				this.clearColorBuffer(attachment.texture, attachment.clearValue, i);
			}
		}

		if (this.depthAttachment && this.depthAttachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
			this.gl.clearBufferfi(WebGL2Constants.DEPTH_STENCIL, 0, this.depthAttachment.clearValue, 0);
		}
	}

	private clearColorBuffer(texture: AbstractTexture, clearValue: ColorClearValue, drawBuffer: number) {
		switch (texture.format) {
			case RendererTypes.TextureFormat.RGBA8Unorm:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
		}
	}

	private static clearValueToTypedArray<T extends TypedArray>(type: { new(arr: number[]): T }, clearValue: ColorClearValue): T {
		return new type([clearValue.r, clearValue.g, clearValue.b, clearValue.a]);
	}

	public delete() {
		this.renderer.gl.deleteFramebuffer(this.WebGLFramebuffer);
	}
}