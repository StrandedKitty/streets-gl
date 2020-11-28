import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import ObjectFilterMaterial from "../materials/ObjectFilterMaterial";

export default class ObjectFilterPass {
	private readonly renderer: Renderer;
	private width: number;
	private height: number;
	public material: ObjectFilterMaterial;
	public framebuffer: Framebuffer;
	private clearValue: Float32Array = new Float32Array([0, 0, 0, 0]);

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init() {
		this.material = new ObjectFilterMaterial(this.renderer);

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
					format: GLConstants.RED,
					internalFormat: GLConstants.R8,
					type: GLConstants.UNSIGNED_BYTE
				})
			]
		});
	}

	public clear() {
		this.renderer.bindFramebuffer(this.framebuffer);

		this.renderer.gl.clearBufferfv(GLConstants.COLOR, 0, this.clearValue);
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(width, height);
	}
}