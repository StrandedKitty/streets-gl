import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import UniformType = RendererTypes.UniformType;

export default class AtmosphereSkyViewMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Atmosphere sky-view LUT material',
			uniforms: [
				{
					name: 'tTransmittanceLUT',
					block: null,
					type: UniformType.Texture2D,
					value: null
				}, {
					name: 'tMultipleScatteringLUT',
					block: null,
					type: UniformType.Texture2D,
					value: null
				}, {
					name: 'sunDirection',
					block: 'Uniforms',
					type: UniformType.Float3,
					value: new Float32Array(3)
				}, {
					name: 'cameraHeight',
					block: 'Uniforms',
					type: UniformType.Float1,
					value: new Float32Array(1)
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
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
			vertexShaderSource: Shaders.atmosphereSkyView.vertex,
			fragmentShaderSource: Shaders.atmosphereSkyView.fragment
		});
	}
}
