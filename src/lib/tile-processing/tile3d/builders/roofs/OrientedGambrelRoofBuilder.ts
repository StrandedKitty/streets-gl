import Vec2 from "~/lib/math/Vec2";
import OrientedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/OrientedRoofBuilder";

export default class OrientedGambrelRoofBuilder extends OrientedRoofBuilder {
    protected splits: Vec2[] = [
		new Vec2(0, 0),
		new Vec2(0.15, 0.8),
		new Vec2(0.5, 1),
		new Vec2(0.85, 0.8),
		new Vec2(1, 0),
    ];
	protected isSmooth: boolean = false;
	protected respectDirection: boolean = false;
}