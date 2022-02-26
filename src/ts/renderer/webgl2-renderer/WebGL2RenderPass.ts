import AbstractRenderPass, {
	AbstractRenderPassParams,
	ColorAttachment, DepthAttachment
} from "~/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Framebuffer from "~/renderer/webgl2-renderer/WebGL2Framebuffer";

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
}