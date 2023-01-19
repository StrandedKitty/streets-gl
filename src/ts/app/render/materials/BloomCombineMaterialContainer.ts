import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class BloomCombineMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Bloom combine material',
			uniforms: [
				{
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tBlurred0',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tBlurred1',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tBlurred2',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tBlurred3',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
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
			vertexShaderSource: Shaders.bloomCombine.vertex,
			fragmentShaderSource: Shaders.bloomCombine.fragment
		});
	}
}
