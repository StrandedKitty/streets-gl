import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import Vec3 from "~/lib/math/Vec3";
import {Tile3DBuffersExtruded} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";

interface MeshDisplayBufferPatch {
	start: number;
	size: number;
	value: number;
}

export default class TileBuildings extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	private meshDisplayBufferPatches: MeshDisplayBufferPatch[] = [];

	public constructor(private buffers: Tile3DBuffersExtruded) {
		super();

		const box = buffers.boundingBox;

		this.setBoundingBox(
			new Vec3(box.minX, box.minY, box.minZ),
			new Vec3(box.maxX, box.maxY, box.maxZ)
		);
	}

	public addDisplayBufferPatch(patch: MeshDisplayBufferPatch): void {
		this.meshDisplayBufferPatches.push(patch);
	}

	public isMeshReady(): boolean {
		return this.mesh !== null && this.meshDisplayBufferPatches.length === 0;
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
						data: this.buffers.positionBuffer
					}),
					renderer.createAttribute({
						name: 'normal',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.buffers.normalBuffer
					}),
					renderer.createAttribute({
						name: 'color',
						size: 3,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Float,
						normalized: true,
						data: this.buffers.colorBuffer
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.buffers.uvBuffer
					}),
					renderer.createAttribute({
						name: 'textureId',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: this.buffers.textureIdBuffer
					}),
					renderer.createAttribute({
						name: 'localId',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedInt,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: this.buffers.localIdBuffer
					}),
					renderer.createAttribute({
						name: 'display',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: new Uint8Array(this.buffers.localIdBuffer.length)
					})
				]
			});
		}

		for (const {start, size, value} of this.meshDisplayBufferPatches) {
			const attribute = this.mesh.getAttribute('display');
			const buffer = attribute.data;

			for (let i = start; i < start + size; i++) {
				buffer[i] = value;
			}

			this.mesh.getAttribute('display').setData(buffer);
		}

		this.meshDisplayBufferPatches.length = 0;
	}

	public dispose(): void {
		if (this.mesh) {
			this.mesh.delete();
		}
	}
}