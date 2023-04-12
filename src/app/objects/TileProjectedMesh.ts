import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {Tile3DBuffersProjected} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Vec3 from "~/lib/math/Vec3";

export default class TileProjectedMesh extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	public constructor(private buffers: Tile3DBuffersProjected) {
		super();

		const box = buffers.boundingBox;

		this.setBoundingBox(
			new Vec3(box.minX, box.minY, box.minZ),
			new Vec3(box.maxX, box.maxY, box.maxZ)
		);
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.mesh) {
			this.mesh = renderer.createMesh({
				attributes: [
					renderer.createAttribute({
						name: 'position',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer({
							data: this.buffers.positionBuffer
						})
					}),
					renderer.createAttribute({
						name: 'normal',
						size: 3,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer({
							data: this.buffers.normalBuffer
						})
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer({
							data: this.buffers.uvBuffer
						})
					}),
					renderer.createAttribute({
						name: 'textureId',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						buffer: renderer.createAttributeBuffer({
							data: this.buffers.textureIdBuffer
						})
					})
				]
			});
		}
	}

	public dispose(): void {
		if (this.mesh) {
			this.mesh.getAttribute('position').buffer.delete();
			this.mesh.getAttribute('normal').buffer.delete();
			this.mesh.getAttribute('uv').buffer.delete();
			this.mesh.getAttribute('textureId').buffer.delete();

			this.mesh.delete();
		}
	}
}