import AABB from "~/lib/math/AABB";
import Vec2 from "~/lib/math/Vec2";

export default class AABB2D extends AABB<Vec2> {
	public constructor(min: Vec2, max: Vec2) {
		super();

		this.min = min;
		this.max = max;
	}

	public includePoint(point: Vec2): void {
		this.min.x = Math.min(this.min.x, point.x);
		this.min.y = Math.min(this.min.y, point.y);
		this.max.x = Math.max(this.max.x, point.x);
		this.max.y = Math.max(this.max.y, point.y);
	}

	public includeAABB(aabb: AABB<Vec2>): void {
		this.min.x = Math.min(this.min.x, aabb.min.x);
		this.min.y = Math.min(this.min.y, aabb.min.y);
		this.max.x = Math.max(this.max.x, aabb.max.x);
		this.max.y = Math.max(this.max.y, aabb.max.y);
	}
}