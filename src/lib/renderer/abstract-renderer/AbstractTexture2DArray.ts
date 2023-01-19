import AbstractTexture, {AbstractTextureParams} from "~/lib/renderer/abstract-renderer/AbstractTexture";

export interface AbstractTexture2DArrayParams extends AbstractTextureParams {
	data?: TypedArray[] | HTMLImageElement[];
	depth: number;
}

export default interface AbstractTexture2DArray extends AbstractTexture {
	data: TypedArray[] | HTMLImageElement[];
	depth: number;
	updateFromData(): void;
}