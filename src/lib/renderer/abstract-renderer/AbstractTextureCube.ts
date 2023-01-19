import AbstractTexture, {AbstractTextureParams} from "~/lib/renderer/abstract-renderer/AbstractTexture";

export interface AbstractTextureCubeParams extends AbstractTextureParams {
	data?: TypedArray[] | HTMLImageElement[];
}

export default interface AbstractTextureCube extends AbstractTexture {
	data: TypedArray[] | HTMLImageElement[];
	updateFromData(): void;
}