import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export interface RequestedHeightParams {
	positions: Float64Array;
	callback: (heights: Float64Array) => void;
}

export default interface Handler {
	setMercatorScale(scale: number): void;
	getFeatures(): Tile3DFeature[];
	getRequestedHeightPositions(): RequestedHeightParams;
}