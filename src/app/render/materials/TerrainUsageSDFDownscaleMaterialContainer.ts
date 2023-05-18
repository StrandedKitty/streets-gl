import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class TerrainUsageSDFDownscaleMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer, unpackPower: boolean) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Terrain usage SDF downscale material',
			uniforms: [{
				name: 'tMap',
				block: null,
				type: RendererTypes.UniformType.Texture2D,
				value: null
			}],
			defines: {
				UNPACK_POWER: unpackPower ? '1' : '0'
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
			vertexShaderSource: Shaders.sdfDownscale.vertex,
			fragmentShaderSource: Shaders.sdfDownscale.fragment
		});
	}
}
