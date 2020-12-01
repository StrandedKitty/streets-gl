import GLConstants from "./GLConstants";
import Renderer from "./Renderer";
import Texture from "./Texture";

export default class Texture2D extends Texture {
	protected textureTypeConstant = GLConstants.TEXTURE_2D;
	public url: string;

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
		super(renderer, {anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		if(this.url) {
			this.writeFromBuffer(null);

			this.loadImage();
		} else {
			this.writeFromBuffer(this.data);
		}

		this.gl.bindTexture(GLConstants.TEXTURE_2D, null);
	}

	private loadImage() {
		const image = new Image();

		image.crossOrigin = "anonymous";
		image.onload = () => {
			this.writeFromImage(image);
			this.resolveLoading();
		}
		image.src = this.url;
	}

	private writeFromImage(image: HTMLImageElement) {
		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

		this.width = image.width;
		this.height = image.height;

		this.updateFlipY();
		this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, GLConstants.RGBA, image.width, image.height, 0, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, image);

		this.generateMipmaps();

		this.gl.bindTexture(GLConstants.TEXTURE_2D, null);
	}

	private writeFromBuffer(data: TypedArray) {
		this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);

		this.updateFlipY();
		this.gl.texImage2D(GLConstants.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, data);

		if(data) {
			this.generateMipmaps();
		}

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

					this.gl.bindTexture(GLConstants.TEXTURE_2D, null);

					resolve();
				}
			}))

			image.src = urls[i];
		}

		Promise.all(promises).then(() => {
			this.gl.bindTexture(GLConstants.TEXTURE_2D, this.WebGLTexture);
			this.generateMipmaps();
			this.gl.bindTexture(GLConstants.TEXTURE_2D, null);

			this.resolveLoading();
		});
	}

	public generateMipmaps() {
		if (this.format === GLConstants.RGBA) {
			super.generateMipmaps();
		}
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.writeFromBuffer(this.data);
	}
}
