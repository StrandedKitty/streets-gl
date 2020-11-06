import Texture from "./Texture";
import GLConstants from "./GLConstants";
import Renderer from "./Renderer";

export default class TextureCube extends Texture {
	protected textureTypeConstant = GLConstants.TEXTURE_CUBE_MAP;

	private sidesLoaded: number = 0;
	public urls: string[];
	public loaded: boolean = false;

	constructor(renderer: Renderer, {
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
		flipY = false
	}: {
		urls?: string[],
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
		super(renderer, {anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.urls = urls;

		this.gl.bindTexture(GLConstants.TEXTURE_CUBE_MAP, this.WebGLTexture);

		if(this.urls) {
			for (let i = 0; i < 6; i++) {
				this.gl.texImage2D(GLConstants.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GLConstants.RGBA, 1, 1, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, null);

				this.updateFlipY();
				this.updateWrapping();
				this.updateFilters();
				this.updateAnisotropy();

				const image = new Image();

				image.crossOrigin = "anonymous";
				image.onload = () => this.writeSideImage(image, i);
				image.src = this.urls[i];
			}
		}

		this.gl.bindTexture(GLConstants.TEXTURE_CUBE_MAP, null);
	}

	private writeSideImage(image: HTMLImageElement, sideId: number) {
		this.gl.bindTexture(GLConstants.TEXTURE_CUBE_MAP, this.WebGLTexture);
		this.gl.texImage2D(GLConstants.TEXTURE_CUBE_MAP_POSITIVE_X + sideId, 0, GLConstants.RGBA, image.width, image.height, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, image);

		if(++this.sidesLoaded === 6) {
			this.generateMipmaps();
			this.loaded = true;
		}
	}

	protected writeImage(image: HTMLImageElement): void {

	}

	setSize(width: number, height: number) {

	}
}
