import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import SSAOMaterial from "../materials/SSAOMaterial";

export default class SSAOPass {
	private readonly renderer: Renderer;
	private width: number;
	private height: number;
	private resolutionFactor: number = 0.5;
	public material: SSAOMaterial;
	public framebuffer: Framebuffer;

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width * this.resolutionFactor;
		this.height = height * this.resolutionFactor;

		this.init();
	}

	private init() {
		this.material = new SSAOMaterial(this.renderer);

		this.framebuffer = new Framebuffer(this.renderer, {
			width: this.width,
			height: this.height,
			textures: [
				new Texture2D(this.renderer, {
					width: this.width,
					height: this.height,
					minFilter: GLConstants.LINEAR,
					magFilter: GLConstants.LINEAR,
					wrap: GLConstants.CLAMP_TO_EDGE,
					format: GLConstants.RGBA,
					internalFormat: GLConstants.RGBA8,
					type: GLConstants.UNSIGNED_BYTE
				})
			]
		});
	}

	public setSize(width: number, height: number) {
		this.width = width * this.resolutionFactor;
		this.height = height * this.resolutionFactor;

		this.framebuffer.setSize(this.width, this.height);
	}
}