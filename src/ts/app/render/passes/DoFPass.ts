import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import DoFMaterial from "../materials/DoFMaterial";

export default class DoFPass {
	private readonly renderer: Renderer;
	public width: number;
	public height: number;
	public material: DoFMaterial;
	public framebuffer: Framebuffer;

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width / 2;
		this.height = height / 2;

		this.init();
	}

	private init() {
		this.material = new DoFMaterial(this.renderer);

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
					internalFormat: GLConstants.RGBA16F,
					type: GLConstants.HALF_FLOAT
				})
			]
		});
	}

	public setSize(width: number, height: number) {
		this.width = width / 2;
		this.height = height / 2;

		this.framebuffer.setSize(this.width, this.height);
	}
}