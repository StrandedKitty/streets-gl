import Vec3 from "../math/Vec3";
import Mat4 from "../math/Mat4";
import Frustum from "./Frustum";

export default class AABB {
	public min: Vec3;
	public max: Vec3;

	public constructor(min: Vec3 = new Vec3(0, 0, 0), max: Vec3 = new Vec3(0, 0, 0)) {
		this.min = min;
		this.max = max;
	}

	public toSpace(matrix: Mat4): AABB {
		const min = Vec3.applyMatrix4(this.min, matrix);
		const max = Vec3.applyMatrix4(this.max, matrix);

		return new AABB(min, max);
	}

	public fromFrustum(frustum: Frustum): AABB {
		const vertices: Vec3[] = [];

		for (let i = 0; i < 4; i++) {
			vertices.push(frustum.vertices.near[i]);
			vertices.push(frustum.vertices.far[i]);
		}

		this.min = new Vec3(
			vertices[0].x,
			vertices[0].y,
			vertices[0].z
		);
		this.max = new Vec3(
			vertices[0].x,
			vertices[0].y,
			vertices[0].z
		);

		for (let i = 1; i < 8; i++) {
			this.min.x = Math.min(this.min.x, vertices[i].x);
			this.min.y = Math.min(this.min.y, vertices[i].y);
			this.min.z = Math.min(this.min.z, vertices[i].z);
			this.max.x = Math.max(this.max.x, vertices[i].x);
			this.max.y = Math.max(this.max.y, vertices[i].y);
			this.max.z = Math.max(this.max.z, vertices[i].z);
		}

		return this;
	}

	public getSize(): Vec3 {
		return new Vec3(
			this.max.x - this.min.x,
			this.max.y - this.min.y,
			this.max.z - this.min.z
		);
	}

	public getCenter(): Vec3 {
		return new Vec3(
			(this.max.x + this.min.x) / 2,
			(this.max.y + this.min.y) / 2,
			(this.max.z + this.min.z) / 2,
		);
	}
}
