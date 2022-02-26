import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import GLConstants from "~/renderer/GLConstants";
import AbstractTextureCube, {AbstractTextureCubeParams} from "~/renderer/abstract-renderer/AbstractTextureCube";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";

export default class WebGL2TextureCube extends WebGL2Texture implements AbstractTextureCube {
    protected textureTypeConstant: number = GLConstants.TEXTURE_CUBE_MAP;
	public data: TypedArray[] | HTMLImageElement[];

	constructor(renderer: WebGL2Renderer, params: AbstractTextureCubeParams) {
		super(renderer, params);

		this.data = params.data ?? [];

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		this.updateFromData();
	}

	public updateFromData() {
		this.renderer.bindTexture(this);
		this.updateFlipY();

		if (this.data.length === 6) {
			if (this.data[0] instanceof HTMLImageElement) {
				for (let i = 0; i < this.data.length; i++) {
					this.writeSideFromImage(<HTMLImageElement>this.data[i], i);
				}
			} else {
				for (let i = 0; i < this.data.length; i++) {
					this.writeSideFromBuffer(<TypedArray>this.data[i], i);
				}
			}
		}

		this.generateMipmaps();
		this.renderer.unbindTexture();
	}

	private writeSideFromImage(image: HTMLImageElement, side: number) {
		this.width = image.width;
		this.height = image.height;

		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(
			WebGL2Constants.TEXTURE_CUBE_MAP_POSITIVE_X + side,
			0,
			internalFormat,
			this.width,
			this.height,
			0,
			format,
			type,
			image
		);
	}

	private writeSideFromBuffer(data: TypedArray, side: number) {
		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage2D(
			WebGL2Constants.TEXTURE_CUBE_MAP_POSITIVE_X + side,
			0,
			internalFormat,
			this.width,
			this.height,
			0,
			format,
			type,
			data
		);
	}
}