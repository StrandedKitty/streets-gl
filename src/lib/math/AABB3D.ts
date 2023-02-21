import AABB from "~/lib/math/AABB";
import Vec3 from "~/lib/math/Vec3";

export default class AABB3D extends AABB<Vec3> {
	public constructor(min: Vec3, max: Vec3) {
		super();

		this.min = min;
		this.max = max;
	}

	public includePoint(point: Vec3): void {
		this.min.x = Math.min(this.min.x, point.x);
		this.min.y = Math.min(this.min.y, point.y);
		this.min.z = Math.min(this.min.z, point.z);
		this.max.x = Math.max(this.max.x, point.x);
		this.max.y = Math.max(this.max.y, point.y);
		this.max.z = Math.max(this.max.z, point.z);
	}

	public includeAABB(aabb: AABB<Vec3>): void {
		this.min.x = Math.min(this.min.x, aabb.min.x);
		this.min.y = Math.min(this.min.y, aabb.min.y);
		this.min.z = Math.min(this.min.z, aabb.min.z);
		this.max.x = Math.max(this.max.x, aabb.max.x);
		this.max.y = Math.max(this.max.y, aabb.max.y);
		this.max.z = Math.max(this.max.z, aabb.max.z);
	}
}