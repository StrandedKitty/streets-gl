import RenderableObject3D from "~/app/objects/RenderableObject3D";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/renderer/RendererTypes";

export default class WaterMask extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	private vertices: Float32Array = null;

	public constructor() {
		super();
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public setVertices(vertices: Float32Array): void {
		this.vertices = vertices;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (this.mesh === null) {
			this.mesh = renderer.createMesh({
				attributes: [
					renderer.createAttribute({
						name: 'position',
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						size: 2,
						normalized: false,
						data: this.vertices || new Float32Array(0)
					})
				]
			});

			return;
		}

		this.mesh.getAttribute('position').setData(this.vertices);
	}
}