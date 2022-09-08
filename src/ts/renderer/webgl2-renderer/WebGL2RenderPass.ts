import AbstractRenderPass, {
	AbstractRenderPassParams,
	ColorAttachment,
	DepthAttachment
} from "~/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Framebuffer from "~/renderer/webgl2-renderer/WebGL2Framebuffer";
import WebGL2Constants from '~/renderer/webgl2-renderer/WebGL2Constants';
import WebGL2Texture from '~/renderer/webgl2-renderer/WebGL2Texture';

export default class WebGL2RenderPass implements AbstractRenderPass {
	private readonly renderer: WebGL2Renderer;
	public readonly colorAttachments: ColorAttachment[];
	public readonly depthAttachment: DepthAttachment;
	private framebuffer: WebGL2Framebuffer = null;
	private framebufferNeedsUpdate = false;

	public constructor(
		renderer: WebGL2Renderer,
		{
			colorAttachments,
			depthAttachment
		}: AbstractRenderPassParams
	) {
		this.renderer = renderer;

		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;

		if (this.colorAttachments.length !== 0 || this.depthAttachment) {
			this.createFramebuffer();
		}
	}

	private createFramebuffer(): void {
		this.framebuffer = new WebGL2Framebuffer(this.renderer, this.colorAttachments, this.depthAttachment);
	}

	public begin(): void {
		this.renderer.bindFramebuffer(this.framebuffer);

		if (this.framebufferNeedsUpdate && this.framebuffer) {
			this.framebuffer.bindAttachments();

			this.framebufferNeedsUpdate = false;
		}

		if (this.framebuffer) {
			this.framebuffer.clear();
		}
	}

	public setSize(width: number, height: number): void {
		throw new Error("Method not implemented.");
	}

	public copyColorAttachmentToTexture(attachmentId: number, texture: WebGL2Texture): void {
		this.renderer.bindFramebuffer(this.framebuffer);

		const {internalFormat} = WebGL2Texture.convertFormatToWebGLConstants(texture.format);

		this.renderer.gl.bindTexture(WebGL2Constants.TEXTURE_2D, texture.WebGLTexture);
		this.renderer.gl.readBuffer(WebGL2Constants.COLOR_ATTACHMENT0 + attachmentId);
		this.renderer.gl.copyTexImage2D(WebGL2Constants.TEXTURE_2D, 0, internalFormat, 0, 0, texture.width, texture.height, 0);
	}

	public copyAttachmentsToRenderPass(
		{
			destination,
			sourceColorAttachment = 0,
			targetColorAttachment = 0,
			copyColor = false,
			copyDepth = false
		}: {
			destination: WebGL2RenderPass;
			sourceColorAttachment?: number;
			targetColorAttachment?: number;
			copyColor?: boolean;
			copyDepth?: boolean;
		}
	): void {
		return this.framebuffer.copyAttachmentsToFramebuffer({
			destination: destination.framebuffer,
			sourceColorAttachment,
			targetColorAttachment,
			copyColor,
			copyDepth
		});
	}

	public async readColorAttachmentPixel<T extends TypedArray>(
		attachmentId: number,
		buffer: T,
		x: number,
		y: number,
		width = 1,
		height = 1
	): Promise<void> {
		const texture = this.colorAttachments[attachmentId].texture as WebGL2Texture;
		const pixelBuffer = texture.getPixelPackBuffer();

		this.renderer.bindFramebuffer(this.framebuffer);
		this.renderer.gl.readBuffer(WebGL2Constants.COLOR_ATTACHMENT0 + attachmentId);

		const {format, type} = WebGL2Texture.convertFormatToWebGLConstants(texture.format);

		this.renderer.gl.bindBuffer(WebGL2Constants.PIXEL_PACK_BUFFER, pixelBuffer);
		this.renderer.gl.readPixels(x, texture.height - y - 1, width, height, format, type, 0);
		this.renderer.gl.bindBuffer(WebGL2Constants.PIXEL_PACK_BUFFER, null);

		await this.renderer.fence();

		this.renderer.gl.bindBuffer(WebGL2Constants.PIXEL_PACK_BUFFER, pixelBuffer);
		this.renderer.gl.getBufferSubData(WebGL2Constants.PIXEL_PACK_BUFFER, 0, buffer);
		this.renderer.gl.bindBuffer(WebGL2Constants.PIXEL_PACK_BUFFER, null);
	}

	public delete(): void {
		for (const attachment of this.colorAttachments) {
			attachment.texture.delete();
		}

		if (this.depthAttachment) {
			this.depthAttachment.texture.delete();
		}

		this.framebuffer.delete();
	}
}