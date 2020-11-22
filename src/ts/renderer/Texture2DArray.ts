import Renderer from "./Renderer";
import GLConstants from "./GLConstants";
import Texture from "./Texture";

export default class Texture2DArray extends Texture {
	private depth: number;

	protected textureTypeConstant = GLConstants.TEXTURE_2D_ARRAY;

	constructor(renderer: Renderer, {
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
		flipY = false,
		depth
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
		flipY?: boolean,
		depth: number
	}) {
		super(renderer, {url, anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.depth = depth;

		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.WebGLTexture);

		this.updateFlipY();
		this.updateAnisotropy();
		this.updateFilters();
		this.updateWrapping();

		if(this.url) {
			this.gl.texImage3D(this.gl.TEXTURE_2D_ARRAY, 0, this.gl.RGBA, 1, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

			this.load();
		}

		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, null);
	}

	protected writeImage(image: HTMLImageElement) {
		this.gl.bindTexture(GLConstants.TEXTURE_2D_ARRAY, this.WebGLTexture);

		this.updateFlipY();
		this.gl.texImage3D(GLConstants.TEXTURE_2D_ARRAY, 0, GLConstants.RGBA, image.width, image.height / this.depth, this.depth, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, image);

		this.generateMipmaps();
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;
	}
}
