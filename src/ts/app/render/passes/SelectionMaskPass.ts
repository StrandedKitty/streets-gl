import Renderer from "../../../renderer/Renderer";
import Framebuffer from "../../../renderer/Framebuffer";
import Texture2D from "../../../renderer/Texture2D";
import GLConstants from "../../../renderer/GLConstants";
import BuildingMaskMaterial from "../materials/BuildingMaskMaterial";
import GroundMaskMaterial from "../materials/GroundMaskMaterial";

export default class SelectionMaskPass {
	private readonly renderer: Renderer;
	private width: number;
	private height: number;
	public buildingMaterial: BuildingMaskMaterial;
	public groundMaterial: GroundMaskMaterial;
	public framebuffer: Framebuffer;

	public constructor(renderer: Renderer, width: number, height: number) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.init();
	}

	private init(): void {
		this.buildingMaterial = new BuildingMaskMaterial(this.renderer);
		this.groundMaterial = new GroundMaskMaterial(this.renderer);

		this.framebuffer = new Framebuffer(this.renderer, {
			width: this.width,
			height: this.height,
			usesDepth: true,
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

	public clear(): void {
		this.renderer.bindFramebuffer(this.framebuffer);

		this.renderer.clearFramebuffer({
			color: true,
			depth: true,
			clearColor: [0, 0, 0, 0],
			depthValue: 1
		});
	}

	public setSize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(this.width, this.height);
	}
}