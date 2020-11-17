import TAAMaterial from "../materials/TAAMaterial";
import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import Mat4 from "../../../math/Mat4";

export default class TAAPass {
	private readonly renderer: Renderer;
	private width: number;
	private height: number;
	public material: TAAMaterial
	public framebufferAccum: Framebuffer;
	public framebufferOutput: Framebuffer;
	public matrixWorldInverse: Mat4;
	public matrixWorldInversePrev: Mat4;

	constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init() {
		this.material = new TAAMaterial(this.renderer);

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

		this.framebufferOutput = new Framebuffer(this.renderer, {
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

	public jitterProjectionMatrix(projectionMatrix: Mat4, frame: number) {
		const offsets = [
			[-7 / 8, 1 / 8],
			[-5 / 8, -5 / 8],
			[-1 / 8, -3 / 8],
			[3 / 8, -7 / 8],
			[5 / 8, -1 / 8],
			[7 / 8, 7 / 8],
			[1 / 8, 3 / 8],
			[-3 / 8, 5 / 8]
		];
		projectionMatrix.values[8] = offsets[frame % offsets.length][0] / this.width;
		projectionMatrix.values[9] = offsets[frame % offsets.length][1] / this.height;
	}

	public copyOutputToAccum() {
		this.renderer.blitFramebuffer({
			source: this.framebufferOutput,
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

		this.framebufferOutput.setSize(width, height);
		this.framebufferAccum.setSize(width, height);
	}
}