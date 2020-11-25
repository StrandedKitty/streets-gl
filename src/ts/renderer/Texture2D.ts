import GLConstants from "./GLConstants";
import Renderer from "./Renderer";
import Texture from "./Texture";

export default class Texture2D extends Texture {
	protected textureTypeConstant = GLConstants.TEXTURE_2D;

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
		super(renderer, {url, anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		if(this.url) {
			this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, GLConstants.RGBA, 1, 1, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, null);

			this.load();
		} else {
			this.updateFlipY();

			this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.data);

			if (this.format === GLConstants.RGBA) {
				this.generateMipmaps();
			}
		}

		this.gl.bindTexture(GLConstants.TEXTURE_2D, null);
	}

	protected writeImage(image: HTMLImageElement) {
		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

		this.width = image.width;
		this.height = image.height;

		this.updateFlipY();
		this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, GLConstants.RGBA, image.width, image.height, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, image);

		this.generateMipmaps();
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);
		this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.data);
		this.gl.bindTexture(GLConstants.TEXTURE_2D, null);
	}

	public loadFromTiles(urls: string[], segmentsX: number, segmentsY: number) {
		const promises: Promise<void>[] = [];
		const tileWidth = this.width / segmentsX;
		const tileHeight = this.height / segmentsY;

		for(let i = 0; i < urls.length; i++) {
			const offsetX = (i % segmentsX) / segmentsX * this.width;
			const offsetY = Math.floor(i / segmentsY) / segmentsY * this.height;
			const image = new Image();

			image.crossOrigin = "anonymous";

			promises.push(new Promise<void>(resolve => {
				image.onload = () => {
					this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

					this.updateFlipY();
					this.gl.texSubImage2D(GLConstants.TEXTURE_2D, 0, offsetX, offsetY, tileWidth, tileHeight, this.format, this.type, image);

					resolve();
				}
			}))

			image.src = urls[i];
		}

		Promise.all(promises).then(() => {
			if (this.format === GLConstants.RGBA) {
				this.generateMipmaps();
			}

			this.loadingPromiseResolve();
		});
	}
}
