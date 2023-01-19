import {RendererTypes} from "~/lib/renderer/RendererTypes";

export interface AbstractTextureParams {
	width?: number;
	height?: number;
	anisotropy?: number;
	minFilter?: RendererTypes.MinFilter;
	magFilter?: RendererTypes.MagFilter;
	wrap?: RendererTypes.TextureWrap;
	wrapS?: RendererTypes.TextureWrap;
	wrapT?: RendererTypes.TextureWrap;
	wrapR?: RendererTypes.TextureWrap;
	format: RendererTypes.TextureFormat;
	flipY?: boolean;
	baseLevel?: number;
	maxLevel?: number;
	isImmutable?: boolean;
	immutableLevels?: number;
	mipmaps: boolean;
}

export default interface AbstractTexture {
	width: number;
	height: number;
	anisotropy: number;
	minFilter: RendererTypes.MinFilter;
	magFilter: RendererTypes.MagFilter;
	wrap: RendererTypes.TextureWrap;
	wrapS: RendererTypes.TextureWrap;
	wrapT: RendererTypes.TextureWrap;
	wrapR: RendererTypes.TextureWrap;
	format: RendererTypes.TextureFormat;
	flipY: boolean;
	baseLevel: number;
	maxLevel: number;
	isImmutable: boolean;
	immutableLevels: number;
	mipmaps: boolean;
	generateMipmaps(): void;
	updateBaseAndMaxLevel(): void;
	delete(): void;
}