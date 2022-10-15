import RenderableObject3D from "~/app/objects/RenderableObject3D";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/renderer/RendererTypes";
import {StaticTileGeometry} from "~/app/objects/Tile";
import Vec3 from "~/math/Vec3";

const vertices = new Float32Array([
	-1, 1, 0,
	-1, -1, 0,
	1, 1, 0,
	-1, -1, 0,
	1, -1, 0,
	1, 1, 0
]);

const uvs = new Float32Array([
	0, 1,
	0, 0,
	1, 1,
	0, 0,
	1, 0,
	1, 1
]);

export default class Terrain extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	public constructor() {
		super();
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
						data: vertices
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: uvs
					})
				]
			});
		}
	}
}