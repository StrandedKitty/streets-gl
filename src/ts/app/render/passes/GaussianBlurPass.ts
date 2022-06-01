import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import FullScreenQuad from "../../objects/FullScreenQuad";
import GaussianBlurMaterial from "../materials/GaussianBlurMaterial";

export default class GaussianBlurPass {
	private readonly renderer: Renderer;
	private width: number;
	private height: number;
	public material: GaussianBlurMaterial;
	public framebufferTemp: Framebuffer;
	public framebuffer: Framebuffer;
	public blurDirectionBuffers: [Float32Array, Float32Array] = [
		new Float32Array([1, 0]),
		new Float32Array([0, 1]),
	];

	public constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init(): void {
		this.material = new GaussianBlurMaterial(this.renderer);

		this.framebufferTemp = new Framebuffer(this.renderer, {
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

	public render(quad: FullScreenQuad, texture: Texture2D): void {
		this.renderer.bindFramebuffer(this.framebufferTemp);

		this.material.uniforms.tColor.value = texture;
		this.material.uniforms.direction.value = this.blurDirectionBuffers[0];
		this.material.use();
		quad.draw();

		this.renderer.bindFramebuffer(this.framebuffer);

		this.material.uniforms.tColor.value = this.framebufferTemp.textures[0];
		this.material.uniforms.direction.value = this.blurDirectionBuffers[1];
		this.material.updateUniform('tColor');
		this.material.updateUniform('direction');
		quad.draw();
	}

	public setSize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(width, height);
		this.framebufferTemp.setSize(width, height);
	}
}