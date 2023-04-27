import CurvedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/CurvedRoofBuilder";
import Vec2 from "~/lib/math/Vec2";

export default class DomeRoofBuilder extends CurvedRoofBuilder {
	protected override splits: Vec2[] = [
		new Vec2(0, 1),
		new Vec2(0.17364817766693033, 0.984807753012208),
		new Vec2(0.3420201433256687, 0.9396926207859084),
		new Vec2(0.49999999999999994, 0.8660254037844387),
		new Vec2(0.6427876096865393, 0.766044443118978),
		new Vec2(0.766044443118978, 0.6427876096865394),
		new Vec2(0.8660254037844386, 0.5000000000000001),
		new Vec2(0.9396926207859083, 0.3420201433256688),
		new Vec2(0.984807753012208, 0.17364817766693041),
		new Vec2(1, 0)
	];
	protected isEdgy = false;
}