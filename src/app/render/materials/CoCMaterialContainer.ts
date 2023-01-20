import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class CoCMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'CoC material',
			uniforms: [
				{
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'projectionMatrixInverse',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}
			],
			defines: {
				SENSOR_HEIGHT: '0.024', // 35mm film
				F_NUMBER: '0.01',
				FOCAL_LENGTH: '0.033'
			},
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
			vertexShaderSource: Shaders.coc.vertex,
			fragmentShaderSource: Shaders.coc.fragment
		});
	}
}
