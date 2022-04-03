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
	private framebufferNeedsUpdate: boolean = false;

	constructor(
		renderer: WebGL2Renderer,
		{
			colorAttachments,
			depthAttachment
		}: AbstractRenderPassParams
	) {
		this.renderer = renderer;

		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;

		if (this.colorAttachments.length !== 0) {
			this.createFramebuffer();
		}
	}

	private createFramebuffer() {
		this.framebuffer = new WebGL2Framebuffer(this.renderer, this.colorAttachments, this.depthAttachment);
	}

	public needsUpdate() {
		this.framebufferNeedsUpdate = true;
	}

	public begin() {
		this.renderer.bindFramebuffer(this.framebuffer);

		if (this.framebufferNeedsUpdate && this.framebuffer) {
			this.framebuffer.bindAttachments();

			this.framebufferNeedsUpdate = false;
		}

		if (this.framebuffer) {
			this.framebuffer.clear();
		}
	}

	public setSize(width: number, height: number) {
		throw new Error("Method not implemented.");
	}

	public copyColorAttachmentToTexture(attachmentId: number, texture: WebGL2Texture) {
		this.renderer.bindFramebuffer(this.framebuffer);

		const {internalFormat} = WebGL2Texture.convertFormatToWebGLConstants(texture.format);

		this.renderer.gl.bindTexture(WebGL2Constants.TEXTURE_2D, texture.WebGLTexture);
		this.renderer.gl.readBuffer(WebGL2Constants.COLOR_ATTACHMENT0 + attachmentId);
		this.renderer.gl.copyTexImage2D(WebGL2Constants.TEXTURE_2D, 0, internalFormat, 0, 0, texture.width, texture.height, 0);
	}

	public delete() {
		for (const attachment of this.colorAttachments) {
			attachment.texture.delete();
		}

		if (this.depthAttachment) {
			this.depthAttachment.texture.delete();
		}

		this.framebuffer.delete();
	}
}