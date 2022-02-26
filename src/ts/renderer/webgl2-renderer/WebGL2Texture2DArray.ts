import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import GLConstants from "~/renderer/GLConstants";
import AbstractTexture2DArray, {AbstractTexture2DArrayParams} from "~/renderer/abstract-renderer/AbstractTexture2DArray";

export default class WebGL2Texture2DArray extends WebGL2Texture implements AbstractTexture2DArray {
    protected textureTypeConstant: number = GLConstants.TEXTURE_2D_ARRAY;
	public depth: number;
	public data: TypedArray[] | HTMLImageElement[];

	constructor(renderer: WebGL2Renderer, params: AbstractTexture2DArrayParams) {
		super(renderer, params);

		this.depth = params.depth;
		this.data = params.data ?? [];

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();

		this.updateFromData();
	}

	public updateFromData() {
		this.renderer.bindTexture(this);
		this.updateFlipY();

		if (this.data.length > 0 && this.data[0] instanceof HTMLImageElement && (this.width === undefined || this.height === undefined)) {
			this.width = this.data[0].width;
			this.height = this.data[0].height;
		}

		this.writeFromBuffer(null);

		if (this.data.length > 0) {
			if (this.data[0] instanceof HTMLImageElement) {
				for (let i = 0; i < this.data.length; i++) {
					this.writeSliceFromImage(<HTMLImageElement>this.data[i], i);
				}
			} else {
				for (let i = 0; i < this.data.length; i++) {
					this.writeSliceFromBuffer(<TypedArray>this.data[i], i);
				}
			}
		}

		this.generateMipmaps();
		this.renderer.unbindTexture();
	}

	private writeFromBuffer(data: TypedArray) {
		const {format, internalFormat, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texImage3D(
			this.textureTypeConstant,
			0,
			internalFormat,
			this.width,
			this.height,
			this.depth,
			0,
			format,
			type,
			data
		);
	}

	private writeSliceFromImage(image: HTMLImageElement, slice: number) {
		this.width = image.width;
		this.height = image.height;

		const {format, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texSubImage3D(
			this.textureTypeConstant,
			0,
			0,
			0,
			slice,
			this.width,
			this.height,
			1,
			format,
			type,
			image
		);
	}

	private writeSliceFromBuffer(data: TypedArray, slice: number) {
		const {format, type} = WebGL2Texture.convertFormatToWebGLConstants(this.format);

		this.gl.texSubImage3D(
			this.textureTypeConstant,
			0,
			0,
			0,
			slice,
			this.width,
			this.height,
			1,
			format,
			type,
			data
		);
	}
}