import RenderableObject3D from "~/app/objects/RenderableObject3D";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/renderer/RendererTypes";
import {StaticTileGeometry} from "~/app/objects/Tile";
import Vec3 from "~/math/Vec3";
import Utils from "~/app/Utils";

export default class TileGroundAndBuildings extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	public constructor(private staticTileGeometry: StaticTileGeometry) {
		super();

		const {bboxGround, bbox} = this.staticTileGeometry;

		this.setBoundingBox(
			new Vec3(
				Math.min(bboxGround.min[0], bbox.min[0]),
				Math.min(bboxGround.min[1], bbox.min[1]),
				Math.min(bboxGround.min[2], bbox.min[2])
			), new Vec3(
				Math.max(bboxGround.max[0], bbox.max[0]),
				Math.max(bboxGround.max[1], bbox.max[1]),
				Math.max(bboxGround.max[2], bbox.max[2])
			)
		);
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.mesh) {
			const mergedPositionBuffer = Utils.mergeTypedArrays(Float32Array, [
				this.staticTileGeometry.ground.position,
				this.staticTileGeometry.buildings.position
			]);
			const groundVertexCount = this.staticTileGeometry.ground.position.length / 3;
			const buildingsVertexCount = this.staticTileGeometry.buildings.position.length / 3;
			const buildingsIndexBuffer = new Uint32Array(buildingsVertexCount);

			for (let i = 0; i < buildingsIndexBuffer.length; i++) {
				buildingsIndexBuffer[i] = i + groundVertexCount;
			}

			const mergedIndexBuffer = Utils.mergeTypedArrays(Uint32Array, [
				this.staticTileGeometry.ground.index,
				buildingsIndexBuffer
			]);

			this.mesh = renderer.createMesh({
				indexed: true,
				indices: mergedIndexBuffer,
				attributes: [
					renderer.createAttribute({
						name: 'position',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: mergedPositionBuffer
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