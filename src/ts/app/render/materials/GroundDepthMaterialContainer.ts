import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class GroundDepthMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Building depth material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.groundDepth.vertex,
			fragmentShaderSource: Shaders.groundDepth.fragment
		});
	}
}
