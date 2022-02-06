import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import CoCTempFilterMaterial from "../materials/CoCTempFilterMaterial";

export default class CoCTempFilterPass {
	private readonly renderer: Renderer;
	public width: number;
	public height: number;
	public material: CoCTempFilterMaterial;
	public framebuffer: Framebuffer;
	public framebufferAccum: Framebuffer;

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init() {
		this.material = new CoCTempFilterMaterial(this.renderer);

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

		this.framebufferAccum = new Framebuffer(this.renderer, {
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

	public copyOutputToAccum() {
		this.renderer.blitFramebuffer({
			source: this.framebuffer,
			destination: this.framebufferAccum,
			destinationWidth: this.framebufferAccum.width,
			destinationHeight: this.framebufferAccum.height,
			filter: GLConstants.NEAREST,
			depth: false
		});
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(this.width, this.height);
		this.framebufferAccum.setSize(this.width, this.height);
	}
}