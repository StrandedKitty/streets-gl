import AABB from "~/lib/math/AABB";
import Vec3 from "~/lib/math/Vec3";
import Mat4 from "~/lib/math/Mat4";
import Frustum from "~/lib/core/Frustum";

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
		if (this.isEmpty) {
			this.min.set(point.x, point.y, point.z);
			this.max.set(point.x, point.y, point.z);
			this.isEmpty = false;
			return;
		}

		this.min.x = Math.min(this.min.x, point.x);
		this.min.y = Math.min(this.min.y, point.y);
		this.min.z = Math.min(this.min.z, point.z);
		this.max.x = Math.max(this.max.x, point.x);
		this.max.y = Math.max(this.max.y, point.y);
		this.max.z = Math.max(this.max.z, point.z);
	}

	public includeAABB(aabb: AABB3D): void {
		if (this.isEmpty) {
			this.min.set(aabb.min.x, aabb.min.y, aabb.min.z);
			this.max.set(aabb.max.x, aabb.max.y, aabb.max.z);
			this.isEmpty = false;
			return;
		}

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

	public intersectsAABB(aabb: AABB3D): boolean {
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

	public clone(): AABB3D {
		return new AABB3D(Vec3.clone(this.min), Vec3.clone(this.max));
	}

	public move(x: number, y: number, z: number): AABB3D {
		const vector = new Vec3(x, y, z);

		return new AABB3D(
			Vec3.add(this.min, vector),
			Vec3.add(this.max, vector),
		);
	}

	public scaleScalar(factor: number): AABB3D {
		return new AABB3D(
			Vec3.multiplyScalar(this.min, factor),
			Vec3.multiplyScalar(this.max, factor),
		);
	}

	public getCornerPoints(): Vec3[] {
		return [
			this.min,
			new Vec3(this.max.x, this.min.y, this.min.z),
			new Vec3(this.min.x, this.max.y, this.min.z),
			new Vec3(this.min.x, this.min.y, this.max.z),
			new Vec3(this.max.x, this.max.y, this.min.z),
			new Vec3(this.min.x, this.max.y, this.max.z),
			new Vec3(this.max.x, this.min.y, this.max.z),
			this.max,
		];
	}

	public rotate2D(angle: number): AABB3D {
		const corners = this.getCornerPoints();
		const rotatedAABB = new AABB3D();

		for (const corner of corners) {
			const point = Vec3.rotateAroundAxis(corner, new Vec3(0, 1, 0), angle);
			rotatedAABB.includePoint(point);
		}

		return rotatedAABB;
	}

	public rotateEuler(x: number, y: number, z: number): AABB3D {
		const corners = this.getCornerPoints();
		const rotatedAABB = new AABB3D();

		for (const corner of corners) {
			let point = Vec3.rotateAroundAxis(corner, new Vec3(1, 0, 0), x);
			point = Vec3.rotateAroundAxis(point, new Vec3(0, 1, 0), y);
			point = Vec3.rotateAroundAxis(point, new Vec3(0, 0, 1), z);

			rotatedAABB.includePoint(point);
		}

		return rotatedAABB;
	}

	public scale(x: number, y: number, z: number): AABB3D {
		const vector = new Vec3(x, y, z);

		return new AABB3D(
			Vec3.multiplyPerComponent(this.min, vector),
			Vec3.multiplyPerComponent(this.max, vector),
		);
	}

	public toSpace(matrix: Mat4): AABB3D {
		const min = Vec3.applyMatrix4(this.min, matrix);
		const max = Vec3.applyMatrix4(this.max, matrix);

		return new AABB3D(min, max);
	}

	public getCenter(): Vec3 {
		return new Vec3(
			(this.max.x + this.min.x) / 2,
			(this.max.y + this.min.y) / 2,
			(this.max.z + this.min.z) / 2,
		);
	}

	public static fromFrustum(frustum: Frustum): AABB3D {
		const box = new AABB3D();

		for (let i = 0; i < 4; i++) {
			box.includePoint(frustum.vertices.near[i]);
			box.includePoint(frustum.vertices.far[i]);
		}

		return box;
	}
}