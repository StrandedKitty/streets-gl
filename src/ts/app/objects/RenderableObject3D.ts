import Object3D from "~/core/Object3D";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";

export default abstract class RenderableObject3D extends Object3D {
	public abstract mesh: AbstractMesh;

	public draw() {
		this.mesh.draw();
	}
}