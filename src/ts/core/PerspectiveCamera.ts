import Mat4 from "../math/Mat4";
import MathUtils from "../math/MathUtils";
import Camera from "./Camera";

export default class PerspectiveCamera extends Camera {
	public fov: number;
	public near: number;
	public far: number;
	public aspect: number;

	public constructor({fov, near, far, aspect}: {fov: number; near: number; far: number; aspect: number}) {
		super();

		this.fov = fov;
		this.near = near;
		this.far = far;
		this.aspect = aspect;

		this.updateProjectionMatrix();
	}

	public updateProjectionMatrix(): void {
		this.projectionMatrix = Mat4.perspective(
			MathUtils.toRad(this.fov / this.zoomFactor),
			this.aspect,
			this.near,
			this.far
		);
		this.updateProjectionMatrixInverse();
	}
}
