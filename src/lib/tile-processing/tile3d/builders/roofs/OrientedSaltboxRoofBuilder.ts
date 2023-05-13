import Vec2 from "~/lib/math/Vec2";
import OrientedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/OrientedRoofBuilder";

export default class OrientedSaltboxRoofBuilder extends OrientedRoofBuilder {
	protected splits: Vec2[] = [
		new Vec2(0, 0),
		new Vec2(0.7, 1),
		new Vec2(1, 0.2),
	];
	protected isSmooth: boolean = false;
	protected respectDirection: boolean = true;
}