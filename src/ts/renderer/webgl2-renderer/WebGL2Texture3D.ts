import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import GLConstants from "~/renderer/GLConstants";
import AbstractTexture3D, {AbstractTexture3DParams} from "~/renderer/abstract-renderer/AbstractTexture3D";

export default class WebGL2Texture3D extends WebGL2Texture implements AbstractTexture3D {
    protected textureTypeConstant: number = GLConstants.TEXTURE_3D;
	public depth: number;
	public data: TypedArray[] | HTMLImageElement[];

	constructor(renderer: WebGL2Renderer, params: AbstractTexture3DParams) {
		super(renderer, params);

		this.depth = params.depth;
		this.data = params.data ?? [];

		this.updateWrapping();
		this.updateFilters();
		this.updateAnisotropy();
	}

	updateFromData(): void {

	}
}