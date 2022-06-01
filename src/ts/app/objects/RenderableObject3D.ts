import Object3D from "~/core/Object3D";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from '~/renderer/abstract-renderer/AbstractRenderer';

export default abstract class RenderableObject3D extends Object3D {
	public abstract mesh: AbstractMesh;

	public abstract updateMesh(renderer: AbstractRenderer): void;

	public abstract isMeshReady(): boolean;

	public draw(): void {
		this.mesh.draw();
	}
}