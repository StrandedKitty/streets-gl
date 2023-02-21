import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {StaticTileGeometry} from "./Tile";
import Vec3 from "~/lib/math/Vec3";

interface Buffers {
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
}

export default class TileRoads extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	public constructor(private buffers: Buffers) {
		super();

		/*this.setBoundingBox(
			new Vec3(...staticTileGeometry.bboxGround.min),
			new Vec3(...staticTileGeometry.bboxGround.max)
		);*/
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
						data: this.buffers.positionBuffer
					}),
					renderer.createAttribute({
						name: 'normal',
						size: 3,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.buffers.normalBuffer
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type:  RendererTypes.AttributeType.Float32,
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
					})
				]
			});
		}
	}

	public dispose(): void {
		if (this.mesh) {
			this.mesh.delete();
		}
	}
}