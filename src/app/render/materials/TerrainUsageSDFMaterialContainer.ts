import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class TerrainUsageSDFMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Terrain usage SDF material',
			uniforms: [{
				name: 'direction',
				block: 'MainBlock',
				type: RendererTypes.UniformType.Float2,
				value: new Float32Array(2)
			}, {
				name: 'beta',
				block: 'MainBlock',
				type: RendererTypes.UniformType.Float1,
				value: new Float32Array(1)
			}, {
				name: 'tMap',
				block: null,
				type: RendererTypes.UniformType.Texture2D,
				value: null
			}],
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
			vertexShaderSource: Shaders.minErosion.vertex,
			fragmentShaderSource: Shaders.minErosion.fragment
		});
	}
}
