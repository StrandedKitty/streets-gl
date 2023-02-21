import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";

export interface RoofGeometry {
	addSkirt: boolean;
	skirtHeight?: number[][];
	position: number[];
	normal: number[];
	uv: number[];
}

export interface RoofParams {
	multipolygon: Tile3DMultipolygon;
	minHeight: number;
	height: number;
	direction: number;
	flip?: boolean;
}

export default interface RoofBuilder {
	build(params: RoofParams): RoofGeometry;
}