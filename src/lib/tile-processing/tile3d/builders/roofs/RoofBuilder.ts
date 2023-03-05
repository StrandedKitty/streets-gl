import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";

export interface RoofSkirtPoint {
	position: Vec2;
	height: number;
}
export type RoofSkirtPolyline = RoofSkirtPoint[];
export type RoofSkirt = RoofSkirtPolyline[];

export interface RoofGeometry {
	addSkirt: boolean;
	skirt?: RoofSkirt;
	facadeHeightOverride?: number;
	position: number[];
	normal: number[];
	uv: number[];
}

export interface RoofParams {
	multipolygon: Tile3DMultipolygon;
	buildingHeight: number;
	minHeight: number;
	height: number;
	direction: number;
	angle: number;
	orientation: 'along' | 'across';
	flip: boolean;
	scaleX: number;
	scaleY: number;
	isStretched: boolean;
}

export default interface RoofBuilder {
	build(params: RoofParams): RoofGeometry;
}