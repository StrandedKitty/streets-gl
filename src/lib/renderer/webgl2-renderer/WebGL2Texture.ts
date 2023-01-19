import AbstractTexture, {AbstractTextureParams} from "~/lib/renderer/abstract-renderer/AbstractTexture";
import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";

export default abstract class WebGL2Texture implements AbstractTexture {
	public width: number;
	public height: number;
	public anisotropy: number;
	public minFilter: RendererTypes.MinFilter;
	public magFilter: RendererTypes.MagFilter;
	public wrap: RendererTypes.TextureWrap;
	public wrapS: RendererTypes.TextureWrap;
	public wrapT: RendererTypes.TextureWrap;
	public wrapR: RendererTypes.TextureWrap;
	public format: RendererTypes.TextureFormat;
	public flipY: boolean;
	public baseLevel: number;
	public maxLevel: number;
	public mipmaps: boolean;
	public isImmutable: boolean;
	public immutableLevels: number;
	protected abstract textureTypeConstant: number;
	protected renderer: WebGL2Renderer;
	protected gl: WebGL2RenderingContext;
	public WebGLTexture: WebGLTexture;
	private pixelPackBuffer: WebGLBuffer = null;
	protected deleted = false;

	protected constructor(
		renderer: WebGL2Renderer,
		{
			width,
			height,
			anisotropy = 1,
			minFilter = RendererTypes.MinFilter.Nearest,
			magFilter = RendererTypes.MagFilter.Nearest,
			wrap = RendererTypes.TextureWrap.ClampToEdge,
			wrapS = wrap,
			wrapT = wrap,
			wrapR = wrap,
			format,
			flipY = false,
			baseLevel,
			maxLevel,
			mipmaps = false,
			isImmutable = false,
			immutableLevels
		}: AbstractTextureParams
	) {
		this.width = width;
		this.height = height;
		this.anisotropy = anisotropy;
		this.minFilter = minFilter;
		this.magFilter = magFilter;
		this.wrap = wrap;
		this.wrapS = wrapS;
		this.wrapT = wrapT;
		this.wrapR = wrapR;
		this.format = format;
		this.flipY = flipY;
		this.baseLevel = baseLevel;
		this.maxLevel = maxLevel;
		this.mipmaps = mipmaps;
		this.isImmutable = isImmutable;
		this.immutableLevels = immutableLevels;

		this.renderer = renderer;
		this.gl = renderer.gl;

		this.createWebGLTexture();
	}

	private createWebGLTexture(): void {
		this.WebGLTexture = this.gl.createTexture();
	}

	public bind(): void {
		this.gl.bindTexture(this.textureTypeConstant, this.WebGLTexture);
	}

	public unbind(): void {
		this.gl.bindTexture(this.textureTypeConstant, null);
	}

	public updateWrapping(): void {
		const warpS = WebGL2Texture.convertWrapToWebGLConstant(this.wrapS);
		const warpT = WebGL2Texture.convertWrapToWebGLConstant(this.wrapT);
		const warpR = WebGL2Texture.convertWrapToWebGLConstant(this.wrapR);

		this.renderer.bindTexture(this);

		this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_WRAP_S, warpS);
		this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_WRAP_T, warpT);
		this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_WRAP_R, warpR);
	}

	public updateFilters(): void {
		const minFilterConstant = WebGL2Texture.convertMinFilterToWebGLConstant(this.minFilter);
		const magFilterConstant = WebGL2Texture.convertMagFilterToWebGLConstant(this.magFilter);

		this.renderer.bindTexture(this);
		this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_MIN_FILTER, minFilterConstant);
		this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_MAG_FILTER, magFilterConstant);
	}

	public updateBaseAndMaxLevel(): void {
		this.renderer.bindTexture(this);

		if (this.baseLevel !== undefined) {
			this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_BASE_LEVEL, this.baseLevel);
		}

		if (this.maxLevel !== undefined) {
			this.gl.texParameteri(this.textureTypeConstant, WebGL2Constants.TEXTURE_MAX_LEVEL, this.maxLevel);
		}
	}

	public updateFlipY(): void {
		this.gl.pixelStorei(WebGL2Constants.UNPACK_FLIP_Y_WEBGL, this.flipY);
	}

	public generateMipmaps(): void {
		if (this.mipmaps) {
			this.renderer.bindTexture(this);
			this.gl.generateMipmap(this.textureTypeConstant);
		}
	}

	public updateAnisotropy(): void {
		const extension = this.renderer.extensions.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT;

		this.renderer.bindTexture(this);
		this.gl.texParameterf(this.textureTypeConstant, extension, this.anisotropy);
	}

	public getPixelPackBuffer(): WebGLBuffer {
		if (this.pixelPackBuffer) {
			return this.pixelPackBuffer;
		}

		const buffer = this.renderer.gl.createBuffer();

		this.renderer.gl.bindBuffer(this.renderer.gl.PIXEL_PACK_BUFFER, buffer);
		this.renderer.gl.bufferData(
			this.renderer.gl.PIXEL_PACK_BUFFER,
			WebGL2Texture.getFormatByteSize(this.format),
			WebGL2Constants.STATIC_DRAW
		);
		this.renderer.gl.bindBuffer(this.renderer.gl.PIXEL_PACK_BUFFER, null);

		return buffer;
	}

	public delete(): void {
		this.gl.deleteTexture(this.WebGLTexture);
		this.deleted = true;
	}

	public static convertWrapToWebGLConstant(wrap: RendererTypes.TextureWrap): number {
		switch (wrap) {
			case RendererTypes.TextureWrap.ClampToEdge:
				return WebGL2Constants.CLAMP_TO_EDGE;
			case RendererTypes.TextureWrap.Repeat:
				return WebGL2Constants.REPEAT;
			case RendererTypes.TextureWrap.MirroredRepeat:
				return WebGL2Constants.MIRRORED_REPEAT;
		}

		return WebGL2Constants.CLAMP_TO_EDGE;
	}

	public static convertMinFilterToWebGLConstant(minFilter: RendererTypes.MinFilter): number {
		switch (minFilter) {
			case RendererTypes.MinFilter.Nearest:
				return WebGL2Constants.NEAREST;
			case RendererTypes.MinFilter.Linear:
				return WebGL2Constants.LINEAR;
			case RendererTypes.MinFilter.NearestMipmapNearest:
				return WebGL2Constants.NEAREST_MIPMAP_NEAREST;
			case RendererTypes.MinFilter.LinearMipmapNearest:
				return WebGL2Constants.LINEAR_MIPMAP_NEAREST;
			case RendererTypes.MinFilter.NearestMipmapLinear:
				return WebGL2Constants.NEAREST_MIPMAP_LINEAR;
			case RendererTypes.MinFilter.LinearMipmapLinear:
				return WebGL2Constants.LINEAR_MIPMAP_LINEAR;
		}

		return WebGL2Constants.NEAREST;
	}

	public static convertMagFilterToWebGLConstant(magFilter: RendererTypes.MagFilter): number {
		switch (magFilter) {
			case RendererTypes.MagFilter.Nearest:
				return WebGL2Constants.NEAREST;
			case RendererTypes.MagFilter.Linear:
				return WebGL2Constants.LINEAR;
		}

		return WebGL2Constants.NEAREST;
	}

	public static convertFormatToWebGLConstants(format: RendererTypes.TextureFormat): {
		format: number;
		internalFormat: number;
		type: number;
	} {
		switch (format) {
			case RendererTypes.TextureFormat.R8Unorm:
				return {
					format: WebGL2Constants.RED,
					internalFormat: WebGL2Constants.R8,
					type: WebGL2Constants.UNSIGNED_BYTE
				};
			case RendererTypes.TextureFormat.RG8Unorm:
				return {
					format: WebGL2Constants.RG,
					internalFormat: WebGL2Constants.RG8,
					type: WebGL2Constants.UNSIGNED_BYTE
				};
			case RendererTypes.TextureFormat.RGB8Unorm:
				return {
					format: WebGL2Constants.RGB,
					internalFormat: WebGL2Constants.RGB8,
					type: WebGL2Constants.UNSIGNED_BYTE
				};
			case RendererTypes.TextureFormat.RGBA8Unorm:
				return {
					format: WebGL2Constants.RGBA,
					internalFormat: WebGL2Constants.RGBA8,
					type: WebGL2Constants.UNSIGNED_BYTE
				};
			case RendererTypes.TextureFormat.RGBA32Float:
				return {
					format: WebGL2Constants.RGBA,
					internalFormat: WebGL2Constants.RGBA32F,
					type: WebGL2Constants.FLOAT
				};
			case RendererTypes.TextureFormat.RGB32Float:
				return {
					format: WebGL2Constants.RGB,
					internalFormat: WebGL2Constants.RGB32F,
					type: WebGL2Constants.FLOAT
				};
			case RendererTypes.TextureFormat.RGBA16Float:
				return {
					format: WebGL2Constants.RGBA,
					internalFormat: WebGL2Constants.RGBA16F,
					type: WebGL2Constants.HALF_FLOAT
				};
			case RendererTypes.TextureFormat.RGB16Float:
				return {
					format: WebGL2Constants.RGB,
					internalFormat: WebGL2Constants.RGB16F,
					type: WebGL2Constants.HALF_FLOAT
				};
			case RendererTypes.TextureFormat.R16Float:
				return {
					format: WebGL2Constants.RED,
					internalFormat: WebGL2Constants.R16F,
					type: WebGL2Constants.HALF_FLOAT
				};
			case RendererTypes.TextureFormat.Depth32Float:
				return {
					format: WebGL2Constants.DEPTH_COMPONENT,
					internalFormat: WebGL2Constants.DEPTH_COMPONENT32F,
					type: WebGL2Constants.FLOAT
				};
			case RendererTypes.TextureFormat.R32Uint:
				return {
					format: WebGL2Constants.RED_INTEGER,
					internalFormat: WebGL2Constants.R32UI,
					type: WebGL2Constants.UNSIGNED_INT
				};
			case RendererTypes.TextureFormat.R32Float:
				return {
					format: WebGL2Constants.RED,
					internalFormat: WebGL2Constants.R32F,
					type: WebGL2Constants.FLOAT
				};
		}

		return {
			format: WebGL2Constants.RGBA,
			internalFormat: WebGL2Constants.RGBA8,
			type: WebGL2Constants.UNSIGNED_BYTE
		};
	}

	public static getFormatByteSize(format: RendererTypes.TextureFormat): number {
		switch (format) {
			case RendererTypes.TextureFormat.R8Unorm:
				return 1;
			case RendererTypes.TextureFormat.RG8Unorm:
				return 2;
			case RendererTypes.TextureFormat.RGB8Unorm:
				return 3;
			case RendererTypes.TextureFormat.RGBA8Unorm:
				return 4;
			case RendererTypes.TextureFormat.RGBA32Float:
				return 16;
			case RendererTypes.TextureFormat.Depth32Float:
				return 4;
			case RendererTypes.TextureFormat.RGB16Float:
				return 6;
			case RendererTypes.TextureFormat.R16Float:
				return 2;
			case RendererTypes.TextureFormat.R32Uint:
				return 4;
			case RendererTypes.TextureFormat.R32Float:
				return 4;
		}

		return 4;
	}
}
