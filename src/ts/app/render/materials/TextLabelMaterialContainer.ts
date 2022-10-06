import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import ResourceManager from "~/app/world/ResourceManager";

export default class TextLabelMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Text label material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixNoRotation',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'resolution',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array(2)
				}, {
					name: 'tSDF',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: this.renderer.createTexture2D({
						anisotropy: 16,
						data: ResourceManager.get('fontSDF'),
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.ClampToEdge,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
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
					srcFactor: RendererTypes.BlendFactor.SrcAlpha,
					dstFactor: RendererTypes.BlendFactor.OneMinusSrcAlpha
				},
				alpha: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.SrcAlpha,
					dstFactor: RendererTypes.BlendFactor.OneMinusSrcAlpha
				}
			},
			vertexShaderSource: Shaders.textLabel.vertex,
			fragmentShaderSource: Shaders.textLabel.fragment
		});
	}
}
