import RenderableObject3D from "~/app/objects/RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {ModelSourceBuffers} from "~/app/objects/models/ModelManager";
import AABB3D from "~/lib/math/AABB3D";

// Placeholder
export default class InstancedObject extends RenderableObject3D {
	public mesh: AbstractMesh;
	public instanceBuffers: ModelSourceBuffers;

	public setInstancesInterleavedBuffer(interleavedBuffer: Float32Array): void {

	}

	public isMeshReady(): boolean {
		return false;
	}

	public updateMesh(renderer: AbstractRenderer): void {

	}

	/*public getInstanceModelAABB(): AABB3D {
		return this.instanceBuffers.boundingBox;
	}*/
}