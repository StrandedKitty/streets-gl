import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class ScreenMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Screen material',
			uniforms: [
				{
					name: 'tHDR',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tLabels',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'resolution',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array(2)
				}, {
					name: 'slippyMapFactor',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Float1,
					value: new Float32Array(1)
				}, {
					name: 'tSlippyMap',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}
			],
			defines: {
				LABELS_ENABLED: '1',
				BARREL_DISTORTION_ENABLED: '1'
			},
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
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
			vertexShaderSource: Shaders.screen.vertex,
			fragmentShaderSource: Shaders.screen.fragment
		});
	}
}
