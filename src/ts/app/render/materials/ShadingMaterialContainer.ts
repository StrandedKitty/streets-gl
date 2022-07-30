import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class ShadingMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Shading material',
			uniforms: [
				{
					name: 'tColor',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tPosition',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tShadowMaps',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: null
				}, {
					name: 'viewMatrix',
					block: null,
					type: RendererTypes.UniformType.Matrix4,
					value: null
				}, {
					name: 'CSMSplits',
					block: 'CSM',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array()
				}, {
					name: 'CSMResolution',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMSize',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMBias',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMMatrixWorldInverse',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMFadeOffset',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
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
			vertexShaderSource: Shaders.shading.vertex,
			fragmentShaderSource: Shaders.shading.fragment
		});
	}
}
