import CurvedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/CurvedRoofBuilder";
import Vec2 from "~/lib/math/Vec2";

export default class OnionRoofBuilder extends CurvedRoofBuilder {
	protected override splits: Vec2[] = [
		new Vec2(0, 1),
		new Vec2(0.1111111111111111, 1.1470588235294117),
		new Vec2(0.2222222222222222, 1.1764705882352942),
		new Vec2(0.3333333333333333, 1.1470588235294117),
		new Vec2(0.4444444444444444, 1),
		new Vec2(0.5555555555555556, 0.7647058823529411),
		new Vec2(0.6666666666666666, 0.4117647058823529),
		new Vec2(0.7777777777777778, 0.15882352941176472),
		new Vec2(0.8888888888888888, 0.03529411764705882),
		new Vec2(1, 0)
	];
	protected isEdgy = false;
}