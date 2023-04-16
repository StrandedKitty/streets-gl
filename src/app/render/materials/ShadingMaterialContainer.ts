import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import Config from "../../Config";

export default class ShadingMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Shading material',
			defines: {
				SHADOW_ENABLED: '1',
				SHADOW_CASCADES: '3',
				SHADOW_CAMERA_NEAR: `${Config.CSMShadowCameraNear}.`,
				SHADOW_CAMERA_FAR: `${Config.CSMShadowCameraFar}.`,
				SSAO_ENABLED: '1',
				SSR_ENABLED: '1'
			},
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
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tRoughnessMetalness',
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
					name: 'tAerialPerspectiveLUT',
					block: null,
					type: RendererTypes.UniformType.Texture3D,
					value: null
				}, {
					name: 'tTransmittanceLUT',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSSR',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tMotion',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tAtmosphere',
					block: null,
					type: RendererTypes.UniformType.TextureCube,
					value: null
				}, {
					name: 'skyRotationMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'viewMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'projectionMatrixInverse',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'projectionMatrixInverseJittered',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'sunDirection',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Float3,
					value: new Float32Array()
				}, {
					name: 'CSMSplits[0]',
					block: 'CSM',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array()
				}, {
					name: 'CSMLightDirectionAndIntensity',
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
			vertexShaderSource: Shaders.shading.vertex,
			fragmentShaderSource: Shaders.shading.fragment
		});
	}
}
