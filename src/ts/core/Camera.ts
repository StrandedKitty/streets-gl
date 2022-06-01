import Object3D from "./Object3D";
import Mat4 from "../math/Mat4";
import Frustum from "./Frustum";
import Plane from "./Plane";

export default abstract class Camera extends Object3D {
	public projectionMatrix: Mat4;
	public projectionMatrixInverse: Mat4;
	public matrixWorldInverse: Mat4;
	public frustumPlanes: Plane[] = null;

	protected constructor() {
		super();

		this.matrixWorldInverse = Mat4.identity();
		this.matrixOverwrite = false;
		this.frustumPlanes = null;
	}

	public updateMatrixWorldInverse(): void {
		this.matrixWorldInverse = Mat4.inverse(this.matrixWorld);
	}

	public updateProjectionMatrixInverse(): void {
		this.projectionMatrixInverse = Mat4.inverse(this.projectionMatrix);
	}

	public abstract updateProjectionMatrix(): void;

	public updateFrustum(): void {
		this.frustumPlanes = Frustum.getPlanes(Mat4.multiply(this.projectionMatrix, this.matrixWorldInverse));
	}
}
