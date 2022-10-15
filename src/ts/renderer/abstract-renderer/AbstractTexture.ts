import {RendererTypes} from "~/renderer/RendererTypes";

export interface AbstractTextureParams {
	width?: number;
	height?: number;
	anisotropy?: number;
	minFilter?: RendererTypes.MinFilter;
	magFilter?: RendererTypes.MagFilter;
	wrap?: RendererTypes.TextureWrap;
	format: RendererTypes.TextureFormat;
	flipY?: boolean;
	mipmaps: boolean;
}

export default interface AbstractTexture {
	width: number;
	height: number;
	anisotropy: number;
	minFilter: RendererTypes.MinFilter;
	magFilter: RendererTypes.MagFilter;
	wrap: RendererTypes.TextureWrap;
	format: RendererTypes.TextureFormat;
	flipY: boolean;
	mipmaps: boolean;
	generateMipmaps(): void;
	delete(): void;
}