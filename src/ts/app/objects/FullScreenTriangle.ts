import Object3D from "~/core/Object3D";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class FullScreenTriangle extends Object3D {
	private renderer: AbstractRenderer;
	public mesh: AbstractMesh;

	constructor(renderer: AbstractRenderer) {
		super();

		this.renderer = renderer;

		this.createMesh();
	}

	private createMesh() {
		this.mesh = this.renderer.createMesh({
			attributes: [
				this.renderer.createAttribute({
					name: 'position',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					data: new Float32Array([
						-1, 3, 0,
						-1, -1, 0,
						3, -1, 0,
					])
				}),
				this.renderer.createAttribute({
					name: 'uv',
					size: 2,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: true,
					data: new Float32Array([
						0, 2,
						0, 0,
						2, 0
					])
				})
			]
		});
	}
}