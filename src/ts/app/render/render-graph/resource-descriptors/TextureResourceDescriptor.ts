import ResourceDescriptor from "~/render-graph/ResourceDescriptor";
import {RendererTypes} from "~/renderer/RendererTypes";

export default class TextureResourceDescriptor extends ResourceDescriptor {
	public width: number;
	public height: number;
	public depth: number;
	public anisotropy: number;
	public dimension: RendererTypes.TextureDimension;
	public minFilter: RendererTypes.MinFilter;
	public magFilter: RendererTypes.MagFilter;
	public wrap: RendererTypes.TextureWrap;
	public format: RendererTypes.TextureFormat;
	public data: TypedArray;
	public image: HTMLImageElement;
	public flipY: boolean;

	constructor(
		{
			width,
			height,
			depth = 1,
			anisotropy = 1,
			dimension = RendererTypes.TextureDimension.Single2D,
			minFilter = RendererTypes.MinFilter.LinearMipmapLinear,
			magFilter = RendererTypes.MagFilter.Linear,
			wrap = RendererTypes.TextureWrap.Repeat,
			format = RendererTypes.TextureFormat.RGBA8Unorm,
			data = null,
			image = null,
			flipY = false
		}: {
			width: number,
			height: number,
			depth: number,
			anisotropy?: number,
			dimension?: RendererTypes.TextureDimension,
			minFilter?: RendererTypes.MinFilter,
			magFilter?: RendererTypes.MagFilter,
			wrap?: RendererTypes.TextureWrap,
			format?: RendererTypes.TextureFormat,
			data?: TypedArray,
			image?: HTMLImageElement,
			flipY?: boolean
		}
	) {
		super();

		this.width = width;
		this.height = height;
		this.depth = depth;
		this.anisotropy = anisotropy;
		this.dimension = dimension;
		this.minFilter = minFilter;
		this.magFilter = magFilter;
		this.wrap = wrap;
		this.format = format;
		this.data = data;
		this.image = image;
		this.flipY = flipY;
	}

	public memorySize(): number {
		return this.width * this.height * this.depth * 4;
	}
	public deserialize(): string {
		return JSON.stringify([
			this.width,
			this.height,
			this.depth,
			this.anisotropy,
			this.dimension,
			this.minFilter,
			this.magFilter,
			this.wrap,
			this.format,
			this.flipY,
		]);
	}
}