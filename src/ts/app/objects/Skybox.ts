import AbstractMesh from "../../renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "../../renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "../../renderer/RendererTypes";
import Object3D from "../../core/Object3D";
import RenderableObject3D from "./RenderableObject3D";

const vertices: number[] = [
	-1.0, -1.0, -1.0,
	-1.0, -1.0, 1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, 1.0,
	-1.0, -1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, 1.0,
	1.0, -1.0, 1.0
];

export default class Skybox extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	constructor() {
		super();

		this.scale.set(1000, 1000, 1000);
	}

	isMeshReady(): boolean {
		return this.mesh !== null;
	}

	updateMesh(renderer: AbstractRenderer) {
		this.mesh = renderer.createMesh({
			attributes: [
				renderer.createAttribute({
					name: 'position',
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					size: 3,
					normalized: false,
					data: new Float32Array(vertices)
				})
			]
		});
	}
}