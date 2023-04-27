import CurvedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/CurvedRoofBuilder";
import Vec2 from "~/lib/math/Vec2";

export default class PyramidalRoofBuilder extends CurvedRoofBuilder {
	protected splits: Vec2[] = [
		new Vec2(0, 1),
		new Vec2(1, 0)
	];
	protected isEdgy = true;
}