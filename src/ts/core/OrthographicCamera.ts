import Mat4 from "../math/Mat4";
import Camera from "./Camera";

export default class OrthographicCamera extends Camera {
	public left: number;
	public right: number;
	public bottom: number;
	public top: number;
	public near: number;
	public far: number;

	public constructor(
		{
			left = -1,
			right = 1,
			bottom = -1,
			top = 1,
			near = 0.1,
			far = 1000
		}: {
			left: number;
			right: number;
			bottom: number;
			top: number;
			near: number;
			far: number;
		}
	) {
		super();

		this.left = left;
		this.right = right;
		this.bottom = bottom;
		this.top = top;
		this.near = near;
		this.far = far;

		this.updateProjectionMatrix();
	}

	public updateProjectionMatrix(): void {
		this.projectionMatrix = Mat4.orthographic(this.left, this.right, this.bottom, this.top, this.near, this.far);
		this.updateProjectionMatrixInverse();
	}
}
