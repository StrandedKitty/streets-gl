import AbstractTexture, {AbstractTextureParams} from "~/renderer/abstract-renderer/AbstractTexture";

export interface AbstractTexture3DParams extends AbstractTextureParams {
	data?: TypedArray[] | HTMLImageElement[];
	depth: number;
}

export default interface AbstractTexture3D extends AbstractTexture {
	data: TypedArray[] | HTMLImageElement[];
	depth: number;
	updateFromData(): void;
}