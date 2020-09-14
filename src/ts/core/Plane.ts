import Vec3 from "../math/Vec3";

export default class Plane {
	public x: number;
	public y: number;
	public z: number;
	public w: number;

	constructor(x: number = 0, y: number = 1, z: number = 0, w: number = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	public normalize(): Plane {
		const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
		this.x /= length;
		this.y /= length;
		this.z /= length;
		this.w /= length;

		return this;
	}

	public distanceToPoint(point: Vec3): number {
		const normal = new Vec3(this.x, this.y, this.z);
		return Vec3.dot(normal, point) + this.w;
	}
}
