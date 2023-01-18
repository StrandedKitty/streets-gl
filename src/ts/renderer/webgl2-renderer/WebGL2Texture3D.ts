import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import AbstractTexture3D, {AbstractTexture3DParams} from "~/renderer/abstract-renderer/AbstractTexture3D";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";

export default class WebGL2Texture3D extends WebGL2Texture implements AbstractTexture3D {
	protected textureTypeConstant: number = WebGL2Constants.TEXTURE_3D;
	public depth: number;
	public data: TypedArray[] | HTMLImageElement[];

	public constructor(renderer: WebGL2Renderer, params: AbstractTexture3DParams) {
		super(renderer, params);

		this.depth = params.depth;
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
		this.writeFromBuffer(null);
		this.generateMipmaps();

		this.renderer.unbindTexture();
	}

	private writeFromBuffer(data: TypedArray): void {
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
}