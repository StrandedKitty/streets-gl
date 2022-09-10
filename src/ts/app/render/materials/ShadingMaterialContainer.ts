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
					name: 'tSSAO',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionMask',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionBlurred',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'viewMatrix',
					block: null,
					type: RendererTypes.UniformType.Matrix4,
					value: null
				}, {
					name: 'CSMSplits[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array()
				}, {
					name: 'CSMLightDirectionAndIntensity[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMResolution[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMSize[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMBias[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMMatrixWorldInverse[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array()
				}, {
					name: 'CSMFadeOffset[0]',
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
