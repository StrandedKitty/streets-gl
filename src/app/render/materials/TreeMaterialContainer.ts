import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import ResourceLoader from "../../world/ResourceLoader";

export default class TreeMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Tree material',
			uniforms: [
				{
					name: 'modelMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'viewMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 5 * 2,
						anisotropy: 16,
						data: [
							ResourceLoader.get('treeBeechDiffuse'),
							ResourceLoader.get('treeBeechNormal'),

							ResourceLoader.get('treeFirDiffuse'),
							ResourceLoader.get('treeFirNormal'),

							ResourceLoader.get('treeLinden0Diffuse'),
							ResourceLoader.get('treeLinden0Normal'),

							ResourceLoader.get('treeLinden1Diffuse'),
							ResourceLoader.get('treeLinden1Normal'),

							ResourceLoader.get('treeOakDiffuse'),
							ResourceLoader.get('treeOakNormal'),
						],
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}, {
					name: 'tVolumeNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: this.renderer.createTexture2D({
						width: 256,
						height: 256,
						anisotropy: 16,
						data: ResourceLoader.get('treeVolumeNormal'),
						minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
						magFilter: RendererTypes.MagFilter.Linear,
						wrap: RendererTypes.TextureWrap.Repeat,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}
			],
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
			vertexShaderSource: Shaders.tree.vertex,
			fragmentShaderSource: Shaders.tree.fragment
		});
	}
}
