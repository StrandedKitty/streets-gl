import Renderer from "./Renderer";
import GLConstants from "./GLConstants";
import Texture from "./Texture";

export default class Texture2DArray extends Texture {
	protected textureTypeConstant = GLConstants.TEXTURE_2D_ARRAY;
	public depth: number;
	public urls: string[];
	private imagesLoaded = 0;

	public constructor(renderer: Renderer, {
		urls,
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
		flipY = false,
		depth
	}: {
		urls?: string[];
		anisotropy?: number;
		minFilter?: number;
		magFilter?: number;
		wrap?: number;
		width?: number;
		height?: number;
		format?: number;
		internalFormat?: number;
		type?: number;
		data?: TypedArray;
		flipY?: boolean;
		depth: number;
	}) {
		super(renderer, {anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.urls = urls;
		this.depth = depth;

		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.WebGLTexture);

		this.updateFlipY();
		this.updateAnisotropy();
		this.updateFilters();
		this.updateWrapping();

		if(this.urls && this.urls.length > 0) {
			this.writeFromBuffer(null);

			for(let i = 0; i < this.urls.length; i++) {
				this.writeFromBuffer(null);
				this.loadImage(i);
			}
		} else {
			this.writeFromBuffer(this.data);
		}

		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, null);
	}

	private loadImage(slice: number): void {
		const image = new Image();

		image.crossOrigin = "anonymous";
		image.onload = (): void => {
			this.writeFromImage(image, slice);

			if(++this.imagesLoaded === this.urls.length) {
				this.resolveLoading();
			}
		}
		image.src = this.urls[slice];
	}

	private writeFromImage(image: HTMLImageElement, slice: number): void {
		this.gl.bindTexture(GLConstants.TEXTURE_2D_ARRAY, this.WebGLTexture);

		this.updateFlipY();
		this.gl.texSubImage3D(GLConstants.TEXTURE_2D_ARRAY, 0, 0, 0, slice, this.width, this.height, 1, this.format, this.type, image);

		this.generateMipmaps();
	}

	private writeFromBuffer(data: TypedArray): void {
		this.gl.bindTexture(GLConstants.TEXTURE_2D_ARRAY, this.WebGLTexture);

		this.updateFlipY();
		this.gl.texImage3D(GLConstants.TEXTURE_2D_ARRAY, 0, this.internalFormat, this.width, this.height, this.depth, 0, this.format, this.type, data);

		if(data) {
			this.generateMipmaps();
		}
	}

	public setSize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		this.writeFromBuffer(this.data);
	}
}
