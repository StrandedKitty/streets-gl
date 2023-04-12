import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {InstanceBuffers} from "./InstancedGenericObject";

export default class InstancedAircraft extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	private instanceBuffers: InstanceBuffers;
	private interleavedBuffer: Float32Array = new Float32Array(1);
	private instanceCount: number = 0;

	public constructor(instanceBuffers: InstanceBuffers) {
		super();

		this.instanceBuffers = instanceBuffers;
	}

	public setInstancesInterleavedBuffer(interleavedBuffer: Float32Array, instanceCount: number): void {
		this.interleavedBuffer = interleavedBuffer;
		this.instanceCount = instanceCount;

		if (this.mesh) {
			this.mesh.getAttribute('instancePosition').setData(this.interleavedBuffer);
			this.mesh.getAttribute('instanceRotation').setData(this.interleavedBuffer);
			this.mesh.instanceCount = this.instanceCount;
		}
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.mesh) {
			this.mesh = renderer.createMesh({
				indexed: true,
				indices: this.instanceBuffers.indices,
				instanceCount: this.instanceCount,
				instanced: true,
				attributes: [
					renderer.createAttribute({
						name: 'position',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.instanceBuffers.position
					}),
					renderer.createAttribute({
						name: 'normal',
						size: 3,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.instanceBuffers.normal
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.instanceBuffers.uv
					}),
					renderer.createAttribute({
						name: 'instancePosition',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						instanced: true,
						stride: 4 * 4,
						offset: 0,
						data: this.interleavedBuffer
					}),
					renderer.createAttribute({
						name: 'instanceRotation',
						size: 1,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						instanced: true,
						stride: 4 * 4,
						offset: 3 * 4,
						data: this.interleavedBuffer
					})
				]
			});
		}
	}
}