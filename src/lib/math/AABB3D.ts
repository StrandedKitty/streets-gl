import AABB from "~/lib/math/AABB";
import Vec3 from "~/lib/math/Vec3";

export default class AABB3D extends AABB<Vec3> {
	public constructor(min?: Vec3, max?: Vec3) {
		super();

		if (min && max) {
			this.isEmpty = false;
			this.min = min;
			this.max = max;
		} else {
			this.min = new Vec3();
			this.max = new Vec3();
		}
	}

	public includePoint(point: Vec3): void {
		this.min.x = Math.min(this.min.x, point.x);
		this.min.y = Math.min(this.min.y, point.y);
		this.min.z = Math.min(this.min.z, point.z);
		this.max.x = Math.max(this.max.x, point.x);
		this.max.y = Math.max(this.max.y, point.y);
		this.max.z = Math.max(this.max.z, point.z);
	}

	public includeAABB(aabb: AABB3D): void {
		this.min.x = Math.min(this.min.x, aabb.min.x);
		this.min.y = Math.min(this.min.y, aabb.min.y);
		this.min.z = Math.min(this.min.z, aabb.min.z);
		this.max.x = Math.max(this.max.x, aabb.max.x);
		this.max.y = Math.max(this.max.y, aabb.max.y);
		this.max.z = Math.max(this.max.z, aabb.max.z);
	}

	public includesPoint(point: Vec3): boolean {
		return (
			this.min.x <= point.x &&
			point.x <= this.max.x &&
			this.min.y <= point.y &&
			point.y <= this.max.y &&
			this.min.z <= point.z &&
			point.z <= this.max.z
		);
	}

	public override intersectsAABB(aabb: AABB3D): boolean {
		if (this.isEmpty || aabb.isEmpty) {
			return false;
		}

		return !(
			aabb.max.x <= this.min.x ||
			aabb.min.x >= this.max.x ||
			aabb.max.y <= this.min.y ||
			aabb.min.y >= this.max.y ||
			aabb.max.z <= this.min.z ||
			aabb.min.z >= this.max.z
		);
	}

	public override clone(): AABB3D {
		return new AABB3D(Vec3.clone(this.min), Vec3.clone(this.max));
	}
}