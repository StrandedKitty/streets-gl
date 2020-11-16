import Object3D from "../core/Object3D";
import OrthographicCamera from "../core/OrthographicCamera";
import Renderer from "./Renderer";
import Framebuffer from "./Framebuffer";
import GLConstants from "./GLConstants";
import Texture2D from "./Texture2D";

export default class DirectionalLightShadow extends Object3D {
	private readonly renderer: Renderer;
	public readonly camera: OrthographicCamera;
	public readonly framebuffer: Framebuffer;
	public color: number[];
	public resolution: number;
	public size: number;
	public near: number;
	public far: number;
	public left: number;
	public right: number;
	public bottom: number;
	public top: number;

	constructor(renderer: Renderer, {
		resolution,
		size,
		near,
		far
	}: {
		resolution: number,
		size: number,
		near: number,
		far: number,

	}) {
		super();

		this.renderer = renderer;

		this.resolution = resolution;

		this.size = size;
		this.left = -this.size;
		this.right = this.size;
		this.bottom = -this.size;
		this.top = this.size;
		this.near = near;
		this.far = far;

		this.camera = new OrthographicCamera({
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			near: this.near,
			far: this.far
		});

		this.add(this.camera);

		this.framebuffer = new Framebuffer(this.renderer, {
			width: this.resolution,
			height: this.resolution,
			usesDepth: true,
			textures: []
		});

		this.matrixOverwrite = false;
	}

	public get texture(): Texture2D {
		return this.framebuffer.depthTexture;
	}

	public setSize(resolution: number) {
		this.resolution = resolution;

		this.framebuffer.setSize(resolution, resolution);
	}
}
