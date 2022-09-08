import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import ResourceManager from "~/app/world/ResourceManager";

export default class SSAOBlurMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'SSAO blur material',
			uniforms: [
				{
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tColor',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'direction',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array(2)
				}, {
					name: 'projectionMatrixInverse',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: false,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.bilateralBlur.vertex,
			fragmentShaderSource: Shaders.bilateralBlur.fragment
		});
	}
}
