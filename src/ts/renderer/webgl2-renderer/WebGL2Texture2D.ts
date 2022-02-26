import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import GLConstants from "~/renderer/GLConstants";

export default class WebGL2Texture2D extends WebGL2Texture implements AbstractTexture2D {
    protected textureTypeConstant: number = GLConstants.TEXTURE_2D;
	public data: TypedArray | HTMLImageElement;

	constructor(renderer: WebGL2Renderer, params: AbstractTexture2DParams) {
		super(renderer, params);

		this.data = params.data ?? null;

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		this.updateFromData();
	}

	public updateFromData() {
		this.renderer.bindTexture(this);
		this.updateFlipY();

		if (this.data instanceof HTMLImageElement) {
			this.writeFromImage(this.data);
		} else {
			this.writeFromBuffer(this.data);
		}

		this.generateMipmaps();
		this.renderer.unbindTexture();
	}

	private writeFromImage(image: HTMLImageElement) {
		this.width = image.width;
		this.height = image.height;

		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(this.textureTypeConstant, 0, internalFormat, this.width, this.height, 0, format, type, image);
	}

	private writeFromBuffer(data: TypedArray) {
		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(this.textureTypeConstant, 0, internalFormat, this.width, this.height, 0, format, type, data);
	}
}