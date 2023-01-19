import ResourceDescriptor from "~/lib/render-graph/ResourceDescriptor";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export enum TextureResourceType {
	Texture2D,
	TextureCube,
	Texture2DArray,
	Texture3D
}

export default class TextureResourceDescriptor extends ResourceDescriptor {
	public type: TextureResourceType;
	public width: number;
	public height: number;
	public depth: number;
	public anisotropy: number;
	public minFilter: RendererTypes.MinFilter;
	public magFilter: RendererTypes.MagFilter;
	public wrap: RendererTypes.TextureWrap;
	public format: RendererTypes.TextureFormat;
	public flipY: boolean;
	public mipmaps: boolean;
	public isImmutable: boolean;
	public immutableLevels: number;

	public constructor(
		{
			type,
			width,
			height,
			depth = 1,
			anisotropy = 1,
			minFilter = RendererTypes.MinFilter.LinearMipmapLinear,
			magFilter = RendererTypes.MagFilter.Linear,
			wrap = RendererTypes.TextureWrap.ClampToEdge,
			format = RendererTypes.TextureFormat.RGBA8Unorm,
			flipY = false,
			mipmaps = false,
			isImmutable = false,
			immutableLevels
		}: {
			type: TextureResourceType;
			width: number;
			height: number;
			depth?: number;
			anisotropy?: number;
			minFilter?: RendererTypes.MinFilter;
			magFilter?: RendererTypes.MagFilter;
			wrap?: RendererTypes.TextureWrap;
			format?: RendererTypes.TextureFormat;
			flipY?: boolean;
			mipmaps?: boolean;
			isImmutable?: boolean;
			immutableLevels?: number;
		}
	) {
		super();

		this.type = type;
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.anisotropy = anisotropy;
		this.minFilter = minFilter;
		this.magFilter = magFilter;
		this.wrap = wrap;
		this.format = format;
		this.flipY = flipY;
		this.mipmaps = mipmaps;
		this.isImmutable = isImmutable;
		this.immutableLevels = immutableLevels;
	}

	public setSize(width: number, height: number, depth: number = 1): void {
		this.width = width;
		this.height = height;
		this.depth = depth;
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
			this.minFilter,
			this.magFilter,
			this.wrap,
			this.format,
			this.flipY,
			this.mipmaps
		]);
	}
}