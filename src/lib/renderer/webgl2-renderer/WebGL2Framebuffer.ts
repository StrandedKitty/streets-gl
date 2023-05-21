import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import {ColorAttachment, ColorClearValue, DepthAttachment} from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Texture2DArray from "~/lib/renderer/webgl2-renderer/WebGL2Texture2DArray";
import WebGL2Texture3D from "~/lib/renderer/webgl2-renderer/WebGL2Texture3D";
import WebGL2Texture2D from "~/lib/renderer/webgl2-renderer/WebGL2Texture2D";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractTexture from "~/lib/renderer/abstract-renderer/AbstractTexture";
import WebGL2TextureCube from "~/lib/renderer/webgl2-renderer/WebGL2TextureCube";

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
	private attachedLevels: {color: number[]; depth: number} = {
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

			const targetMipmapLevel = this.colorAttachments[0].level || 0;

			if (targetMipmapLevel > 0) {
				this.width = Math.floor(this.width / (2 ** targetMipmapLevel));
				this.height = Math.floor(this.height / (2 ** targetMipmapLevel));
			}
		} else if (this.depthAttachment) {
			this.width = this.depthAttachment.texture.width;
			this.height = this.depthAttachment.texture.height;
		}
	}

	public bind(): void {
		this.updateDimensionsFromAttachments();

		let shouldUpdateAttachments: boolean = false;

		for (let i = 0; i < this.colorAttachments.length; i++) {
			const attachment = this.colorAttachments[i];
			const sliceUpdated = attachment.slice !== undefined && (
				attachment.slice !== this.attachedLayers.color[i]
			);
			const levelUpdated = attachment.level !== undefined && (
				attachment.level !== this.attachedLevels.color[i]
			);

			if (sliceUpdated || levelUpdated) {
				shouldUpdateAttachments = true;
			}
		}

		if (this.depthAttachment) {
			const attachment = this.depthAttachment;
			const sliceUpdated = attachment.slice !== undefined && (
				attachment.slice !== this.attachedLayers.depth
			);
			const levelUpdated = attachment.level !== undefined && (
				attachment.level !== this.attachedLevels.depth
			);

			if (sliceUpdated || levelUpdated) {
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

			const layer = attachment.slice ?? 0;
			const level = attachment.level ?? 0;

			if (texture instanceof WebGL2Texture2DArray || texture instanceof WebGL2Texture3D) {
				this.gl.framebufferTextureLayer(WebGL2Constants.FRAMEBUFFER, attachmentConstant, texture.WebGLTexture, level, layer);
			} else if (texture instanceof WebGL2TextureCube) {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, attachmentConstant, WebGL2Constants.TEXTURE_CUBE_MAP_POSITIVE_X + attachment.slice, texture.WebGLTexture, level);
			} else {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, attachmentConstant, WebGL2Constants.TEXTURE_2D, (<WebGL2Texture2D>texture).WebGLTexture, level);
			}

			attachments.push(attachmentConstant);
		}

		if (this.depthAttachment) {
			const texture = this.depthAttachment.texture;

			const layer = this.depthAttachment.slice ?? 0;
			const level = this.depthAttachment.level ?? 0;

			if (texture instanceof WebGL2Texture2DArray || texture instanceof WebGL2Texture3D) {
				this.gl.framebufferTextureLayer(WebGL2Constants.FRAMEBUFFER, WebGL2Constants.DEPTH_ATTACHMENT, texture.WebGLTexture, level, layer);
				this.attachedLayers.depth = this.depthAttachment.slice;
			} else {
				this.gl.framebufferTexture2D(WebGL2Constants.FRAMEBUFFER, WebGL2Constants.DEPTH_ATTACHMENT, WebGL2Constants.TEXTURE_2D, (<WebGL2Texture2D>texture).WebGLTexture, level);
			}

			this.attachedLayers.depth = layer;
			this.attachedLevels.depth = level;
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
			copyDepth = false,
			linearFilter = false
		}: {
			destination: WebGL2Framebuffer;
			sourceColorAttachment?: number;
			targetColorAttachment?: number;
			copyColor?: boolean;
			copyDepth?: boolean;
			linearFilter?: boolean;
		}
	): void {
		this.gl.bindFramebuffer(WebGL2Constants.READ_FRAMEBUFFER, this.WebGLFramebuffer);
		this.gl.bindFramebuffer(WebGL2Constants.DRAW_FRAMEBUFFER, destination.WebGLFramebuffer);

		this.gl.readBuffer(WebGL2Constants.COLOR_ATTACHMENT0 + sourceColorAttachment);
		this.gl.drawBuffers(this.buildAttachmentsArray(targetColorAttachment));

		const filter =  linearFilter ? WebGL2Constants.LINEAR : WebGL2Constants.NEAREST;

		if (copyColor) {
			this.gl.blitFramebuffer(
				0, 0, this.width, this.height,
				0, 0, destination.width, destination.height,
				WebGL2Constants.COLOR_BUFFER_BIT, filter
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

	public clearAllAttachments(): void {
		for (let i = 0; i < this.colorAttachments.length; i++) {
			const attachment = this.colorAttachments[i];

			if (attachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
				this.clearColorAttachment(i);
			}
		}

		if (this.depthAttachment) {
			if (this.depthAttachment.loadOp === RendererTypes.AttachmentLoadOp.Clear) {
				this.clearDepthAttachment();
			}
		}
	}

	public clearColorAttachment(attachmentId: number): void {
		const attachment = this.colorAttachments[attachmentId];

		this.clearColorBuffer(attachment.texture, attachment.clearValue, attachmentId);
	}

	public clearDepthAttachment(): void {
		const depthWriteEnabled = this.renderer.depthWrite;

		if (!depthWriteEnabled) {
			this.renderer.depthWrite = true;
		}

		this.gl.clearBufferfi(WebGL2Constants.DEPTH_STENCIL, 0, this.depthAttachment.clearValue, 0);

		if (!depthWriteEnabled) {
			this.renderer.depthWrite = false;
		}
	}

	private clearColorBuffer(texture: AbstractTexture, clearValue: ColorClearValue, drawBuffer: number): void {
		switch (texture.format) {
			case RendererTypes.TextureFormat.RGBA8Unorm:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.R8Unorm:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.RGBA32Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.RGB32Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.RGBA16Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.RGB16Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.R16Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.R32Float:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
			case RendererTypes.TextureFormat.R32Uint:
				this.gl.clearBufferfv(WebGL2Constants.COLOR, drawBuffer, WebGL2Framebuffer.clearValueToTypedArray(Float32Array, clearValue));
				return;
		}

		throw new Error('clearColorBuffer not implemented for TextureFormat ' + texture.format);
	}

	private static clearValueToTypedArray<T extends TypedArray>(type: {new(arr: number[]): T}, clearValue: ColorClearValue): T {
		return new type([clearValue.r, clearValue.g, clearValue.b, clearValue.a]);
	}

	public delete(): void {
		this.renderer.gl.deleteFramebuffer(this.WebGLFramebuffer);
	}
}