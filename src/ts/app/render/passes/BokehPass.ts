import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import SSAOMaterial from "../materials/SSAOMaterial";
import BokehMaterial from "../materials/BokehMaterial";

export default class BokehPass {
	private readonly renderer: Renderer;
	public width: number;
	public height: number;
	public material: BokehMaterial;
	public framebuffer: Framebuffer;

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init() {
		this.material = new BokehMaterial(this.renderer);

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
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(this.width, this.height);
	}
}