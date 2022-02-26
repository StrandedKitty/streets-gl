import AbstractTexture, {AbstractTextureParams} from "~/renderer/abstract-renderer/AbstractTexture";

export interface AbstractTexture2DParams extends AbstractTextureParams {
	data?: TypedArray | HTMLImageElement;
}

export default interface AbstractTexture2D extends AbstractTexture {
	data: TypedArray | HTMLImageElement;
	updateFromData(): void;
}