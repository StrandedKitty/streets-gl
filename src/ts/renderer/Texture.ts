import GLConstants from "./GLConstants";
import Renderer from "./Renderer";

export default abstract class Texture {
	protected readonly gl: WebGL2RenderingContext;
	protected readonly renderer: Renderer;

	public readonly url: string;
	public anisotropy: number;
	public readonly minFilter: number;
	public readonly magFilter: number;
	public wrap: number;
	public width: number;
	public height: number;
	public readonly format: number;
	public readonly internalFormat: any;
	public readonly type: number;
	public data: TypedArray;
	public flipY: boolean;
	public readonly WebGLTexture: WebGLTexture;
	public loadingPromise: Promise<void>;
	protected loadingPromiseResolve: () => void;

	protected abstract textureTypeConstant: number;

	protected constructor(renderer: Renderer, {
		url,
		anisotropy = 1,
		minFilter = GLConstants.LINEAR_MIPMAP_LINEAR,
		magFilter = GLConstants.LINEAR,
		wrap = GLConstants.REPEAT,
		width,
		height,
		format = GLConstants.RGBA,
		internalFormat = GLConstants.RGBA,
		type = GLConstants.UNSIGNED_BYTE,
		data = null,
		flipY = false
	}: {
		url?: string,
		anisotropy?: number,
		minFilter?: number,
		magFilter?: number,
		wrap?: number,
		width?: number,
		height?: number,
		format?: number,
		internalFormat?: number,
		type?: number,
		data?: TypedArray,
		flipY?: boolean
	}) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.url = url;
		this.anisotropy = anisotropy;
		this.minFilter = minFilter;
		this.magFilter = magFilter;
		this.wrap = wrap;
		this.width = width;
		this.height = height;
		this.format = format;
		this.internalFormat = internalFormat;
		this.type = type;
		this.data = data;
		this.flipY = flipY;

		this.WebGLTexture = this.gl.createTexture();
		this.loadingPromise = new Promise<void>((resolve) => {
			this.loadingPromiseResolve = resolve;
		});
	}

	protected load() {
		const image = new Image();

		image.crossOrigin = "anonymous";
		image.onload = () => {
			this.writeImage(image);
			this.loadingPromiseResolve();
		}
		image.src = this.url;
	}

	protected abstract writeImage(image: HTMLImageElement): void;

	public updateWrapping() {
		this.gl.texParameteri(this.textureTypeConstant, GLConstants.TEXTURE_WRAP_S, this.wrap);
		this.gl.texParameteri(this.textureTypeConstant, GLConstants.TEXTURE_WRAP_T, this.wrap);
	}

	public updateFilters() {
		this.gl.texParameteri(this.textureTypeConstant, GLConstants.TEXTURE_MIN_FILTER, this.minFilter);
		this.gl.texParameteri(this.textureTypeConstant, GLConstants.TEXTURE_MAG_FILTER, this.magFilter);
	}

	public updateFlipY() {
		this.gl.pixelStorei(GLConstants.UNPACK_FLIP_Y_WEBGL, this.flipY);
	}

	public generateMipmaps() {
		this.gl.generateMipmap(this.textureTypeConstant);
	};

	public updateAnisotropy() {
		const extension = this.renderer.extensions.get('EXT_texture_filter_anisotropic').TEXTURE_MAX_ANISOTROPY_EXT;
		this.gl.texParameterf(this.textureTypeConstant, extension, this.anisotropy);
	}

	public abstract setSize(width: number, height: number): void;
}
