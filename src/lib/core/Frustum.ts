import MathUtils from '../math/MathUtils';
import Plane from './Plane';
import Vec3 from "../math/Vec3";
import Mat4 from "../math/Mat4";

interface FrustumVertices {
	near: Vec3[];
	far: Vec3[];
}

export default class Frustum {
	public fov: number;
	public aspect: number;
	public near: number;
	public far: number;
	public vertices: FrustumVertices;

	public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
		this.fov = fov;
		this.aspect = aspect;
		this.near = near;
		this.far = far;

		this.vertices = {
			near: [],
			far: []
		};
	}

	public setVertices(vertices: FrustumVertices): void {
		this.vertices = vertices;
	}

	public updateViewSpaceVertices(): void {
		const halfTan = Math.tan(MathUtils.toRad(this.fov / 2));

		const nearPlaneY = this.near * halfTan;
		const nearPlaneX = this.aspect * nearPlaneY;

		const farPlaneY = this.far * halfTan;
		const farPlaneX = this.aspect * farPlaneY;

		// 3 --- 0
		// |     |  vertex order
		// 2 --- 1

		this.vertices.near = [
			new Vec3(nearPlaneX, nearPlaneY, -this.near),
			new Vec3(nearPlaneX, -nearPlaneY, -this.near),
			new Vec3(-nearPlaneX, -nearPlaneY, -this.near),
			new Vec3(-nearPlaneX, nearPlaneY, -this.near)
		];

		this.vertices.far = [
			new Vec3(farPlaneX, farPlaneY, -this.far),
			new Vec3(farPlaneX, -farPlaneY, -this.far),
			new Vec3(-farPlaneX, -farPlaneY, -this.far),
			new Vec3(-farPlaneX, farPlaneY, -this.far)
		];
	}

	public toSpace(matrix: Mat4): Frustum {
		const result = new Frustum(this.fov, this.aspect, this.near, this.far);

		for(let i = 0; i < 4; i++) {
			let near = this.vertices.near[i];
			near = Vec3.applyMatrix4(near, matrix);
			result.vertices.near.push(near);

			let far = this.vertices.far[i];
			far = Vec3.applyMatrix4(far, matrix);
			result.vertices.far.push(far);
		}

		return result;
	}

	public split(breaks: number[][]): FrustumVertices[] {
		const result = Array<FrustumVertices>();

		for(let i = 0; i < breaks.length; i++) {
			const cascade: FrustumVertices = {near: [], far: []};

			for(let j = 0; j < 4; j++) {
				cascade.near.push(Vec3.lerp(this.vertices.near[j], this.vertices.far[j], breaks[i][0]));
			}

			for(let j = 0; j < 4; j++) {
				cascade.far.push(Vec3.lerp(this.vertices.near[j], this.vertices.far[j], breaks[i][1]))
			}

			result.push(cascade);
		}

		return result;
	}

	public static getPlanes(matrix: Mat4): Plane[] {
		const planes = new Array<Plane>(6);
		const values = matrix.values;

		const me0 = values[0], me1 = values[1], me2 = values[2], me3 = values[3];
		const me4 = values[4], me5 = values[5], me6 = values[6], me7 = values[7];
		const me8 = values[8], me9 = values[9], me10 = values[10], me11 = values[11];
		const me12 = values[12], me13 = values[13], me14 = values[14], me15 = values[15];

		planes[0] = new Plane(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
		planes[1] = new Plane(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
		planes[2] = new Plane(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
		planes[3] = new Plane(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
		planes[4] = new Plane(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
		planes[5] = new Plane(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();

		return planes;
	}
}
