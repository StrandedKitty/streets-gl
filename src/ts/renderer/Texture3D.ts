import GLConstants from "./GLConstants";
import Texture from "./Texture";
import Renderer from "./Renderer";

export default class Texture3D extends Texture {
	protected textureTypeConstant = GLConstants.TEXTURE_3D;

	public depth: number;

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
		flipY = false,
		depth
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
		flipY?: boolean,
		depth: number
	}) {
		super(renderer, {url, anisotropy, minFilter, magFilter, wrap, width, height, format, internalFormat, type, data, flipY});

		this.depth = depth;
	}

	setSize(width: number, height: number) {

	}

	protected writeImage(image: HTMLImageElement) {

	}
}
