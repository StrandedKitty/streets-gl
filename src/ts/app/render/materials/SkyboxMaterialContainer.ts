import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class SkyboxMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Skybox material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Front
			},
			depth: {
				depthWrite: false,
				depthCompare: RendererTypes.DepthCompare.Always
			},
			blend: {
				color: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				},
				alpha: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				}
			},
			vertexShaderSource: Shaders.skybox.vertex,
			fragmentShaderSource: Shaders.skybox.fragment
		});
	}
}
