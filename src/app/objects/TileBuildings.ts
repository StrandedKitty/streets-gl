import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {StaticTileGeometry} from "./Tile";
import Vec3 from "~/lib/math/Vec3";

interface MeshDisplayBufferPatch {
	start: number;
	size: number;
	value: number;
}

export default class TileBuildings extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	private meshDisplayBufferPatches: MeshDisplayBufferPatch[] = [];

	public constructor(private staticTileGeometry: StaticTileGeometry) {
		super();

		this.setBoundingBox(
			new Vec3(...staticTileGeometry.bbox.min),
			new Vec3(...staticTileGeometry.bbox.max)
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
						data: this.staticTileGeometry.buildings.position
					}),
					renderer.createAttribute({
						name: 'normal',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.staticTileGeometry.buildings.normal
					}),
					renderer.createAttribute({
						name: 'color',
						size: 3,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Float,
						normalized: true,
						data: this.staticTileGeometry.buildings.color
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: this.staticTileGeometry.buildings.uv
					}),
					renderer.createAttribute({
						name: 'textureId',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: this.staticTileGeometry.buildings.textureId
					}),
					renderer.createAttribute({
						name: 'localId',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedInt,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: this.staticTileGeometry.buildings.localId
					}),
					renderer.createAttribute({
						name: 'display',
						size: 1,
						type: RendererTypes.AttributeType.UnsignedByte,
						format: RendererTypes.AttributeFormat.Integer,
						normalized: false,
						data: new Uint8Array(this.staticTileGeometry.buildings.localId.length)
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