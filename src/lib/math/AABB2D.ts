import AABB from "~/lib/math/AABB";
import Vec2 from "~/lib/math/Vec2";

export default class AABB2D extends AABB<Vec2> {
	public constructor(min?: Vec2, max?: Vec2) {
		super();

		if (min && max) {
			this.isEmpty = false;
			this.min = min;
			this.max = max;
		} else {
			this.min = new Vec2();
			this.max = new Vec2();
		}
	}

	public includePoint(point: Vec2): void {
		if (this.isEmpty) {
			this.min.set(point.x, point.y);
			this.max.set(point.x, point.y);
			this.isEmpty = false;
		}

		this.min.x = Math.min(this.min.x, point.x);
		this.min.y = Math.min(this.min.y, point.y);
		this.max.x = Math.max(this.max.x, point.x);
		this.max.y = Math.max(this.max.y, point.y);
	}

	public includeAABB(aabb: AABB2D): void {
		if (this.isEmpty) {
			this.min.set(aabb.min.x, aabb.min.y);
			this.max.set(aabb.max.x, aabb.max.y);
			this.isEmpty = false;
		}

		this.min.x = Math.min(this.min.x, aabb.min.x);
		this.min.y = Math.min(this.min.y, aabb.min.y);
		this.max.x = Math.max(this.max.x, aabb.max.x);
		this.max.y = Math.max(this.max.y, aabb.max.y);
	}

	public includesPoint(point: Vec2): boolean {
		return (
			this.min.x <= point.x &&
			point.x <= this.max.x &&
			this.min.y <= point.y &&
			point.y <= this.max.y
		);
	}

	public override intersectsAABB(aabb: AABB2D): boolean {
		if (this.isEmpty || aabb.isEmpty) {
			return false;
		}

		return !(
			aabb.max.x <= this.min.x ||
			aabb.min.x >= this.max.x ||
			aabb.max.y <= this.min.y ||
			aabb.min.y >= this.max.y
		);
	}

	public clone(): AABB2D {
		return new AABB2D(Vec2.clone(this.min), Vec2.clone(this.max));
	}

	public getCenter(): Vec2 {
		return new Vec2(
			(this.max.x + this.min.x) / 2,
			(this.max.y + this.min.y) / 2
		);
	}
}
