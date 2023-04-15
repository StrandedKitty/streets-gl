import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {ModelSourceBuffers} from "~/app/objects/models/ModelManager";
import InstancedObject from "~/app/objects/InstancedObject";
import {InstanceStructure, InstanceStructureSchemas} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";

export default class AdvancedInstancedObject extends InstancedObject {
	protected schema = InstanceStructureSchemas[InstanceStructure.Advanced];

	public constructor(instanceBuffers: ModelSourceBuffers) {
		super(instanceBuffers);
	}

	protected createMesh(renderer: AbstractRenderer): AbstractMesh {
		return renderer.createMesh({
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
					buffer: renderer.createAttributeBuffer({
						data: this.instanceBuffers.position
					})
				}),
				renderer.createAttribute({
					name: 'normal',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: this.instanceBuffers.normal
					})
				}),
				renderer.createAttribute({
					name: 'uv',
					size: 2,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: this.instanceBuffers.uv
					})
				}),
				renderer.createAttribute({
					name: 'instancePosition',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					instanced: true,
					stride: 9 * 4,
					offset: 0,
					buffer: this.interleavedAttributeBuffer
				}),
				renderer.createAttribute({
					name: 'instanceScale',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					instanced: true,
					stride: 9 * 4,
					offset: 3 * 4,
					buffer: this.interleavedAttributeBuffer
				}),
				renderer.createAttribute({
					name: 'instanceRotation',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					instanced: true,
					stride: 9 * 4,
					offset: 6 * 4,
					buffer: this.interleavedAttributeBuffer
				})
			]
		});
	}
}