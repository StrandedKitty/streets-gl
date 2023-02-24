import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";
import Tile3DRing from "~/lib/tile-processing/tile3d/builders/Tile3DRing";

export type RoofSkirt = Map<Tile3DRing, [Vec2, number][]>;

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
	flip?: boolean;
}

export default interface RoofBuilder {
	build(params: RoofParams): RoofGeometry;
}