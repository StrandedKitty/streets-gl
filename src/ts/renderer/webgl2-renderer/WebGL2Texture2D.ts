import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";

export default class WebGL2Texture2D extends WebGL2Texture implements AbstractTexture2D {
	protected textureTypeConstant: number = WebGL2Constants.TEXTURE_2D;
	public data: TypedArray | HTMLImageElement;

	public constructor(renderer: WebGL2Renderer, params: AbstractTexture2DParams) {
		super(renderer, params);

		this.data = params.data ?? null;

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		this.updateFromData();
	}

	public updateFromData(): void {
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

	private writeFromImage(image: HTMLImageElement): void {
		this.width = image.width;
		this.height = image.height;

		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(this.textureTypeConstant, 0, internalFormat, this.width, this.height, 0, format, type, image);
	}

	private writeFromBuffer(data: TypedArray): void {
		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(this.textureTypeConstant, 0, internalFormat, this.width, this.height, 0, format, type, data);
	}
}