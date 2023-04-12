import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import ResourceLoader from "../../world/ResourceLoader";

export default class SSAOMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'SSAO material',
			uniforms: [
				{
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tNoise',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: this.renderer.createTexture2D({
						data: ResourceLoader.get('blue_noise_rgba'),
						mipmaps: false,
						minFilter: RendererTypes.MinFilter.Nearest,
						magFilter: RendererTypes.MagFilter.Nearest,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						wrap: RendererTypes.TextureWrap.Repeat
					})
				}, {
					name: 'tMotion',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'projectionMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrixInverse',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'randomOffset',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Float4,
					value: new Float32Array(4)
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
			vertexShaderSource: Shaders.ssao.vertex,
			fragmentShaderSource: Shaders.ssao.fragment
		});
	}
}
