import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import AbstractTextureCube, {AbstractTextureCubeParams} from "~/renderer/abstract-renderer/AbstractTextureCube";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";

export default class WebGL2TextureCube extends WebGL2Texture implements AbstractTextureCube {
	protected textureTypeConstant: number = WebGL2Constants.TEXTURE_CUBE_MAP;
	public data: TypedArray[] | HTMLImageElement[];

	public constructor(renderer: WebGL2Renderer, params: AbstractTextureCubeParams) {
		super(renderer, params);

		this.data = params.data ?? [];

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();
		this.updateBaseAndMaxLevel();

		this.updateFromData();
	}

	public updateFromData(): void {
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
		} else {
			for (let i = 0; i < 6; i++) {
				this.writeSideFromBuffer(null, i);
			}
		}

		this.generateMipmaps();
		this.renderer.unbindTexture();
	}

	private writeSideFromImage(image: HTMLImageElement, side: number): void {
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

	private writeSideFromBuffer(data: TypedArray, side: number): void {
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