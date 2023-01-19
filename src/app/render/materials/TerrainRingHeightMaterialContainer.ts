import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default class TerrainRingHeightMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Terrain ring height material',
			uniforms: [{
				name: 'tHeight',
				block: null,
				type: RendererTypes.UniformType.Texture2D,
				value: null
			}, {
				name: 'transformHeight',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float4,
				value: new Float32Array(4)
			}, {
				name: 'morphOffset',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float2,
				value: new Float32Array(2)
			}, {
				name: 'size',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float1,
				value: new Float32Array(1)
			}, {
				name: 'segmentCount',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float1,
				value: new Float32Array(1)
			}, {
				name: 'isLastRing',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float1,
				value: new Float32Array(1)
			}, {
				name: 'cameraPosition',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Float2,
				value: new Float32Array(2)
			}, {
				name: 'levelId',
				block: 'PerMesh',
				type: RendererTypes.UniformType.Int1,
				value: new Int32Array(1)
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
			vertexShaderSource: Shaders.terrainRingHeight.vertex,
			fragmentShaderSource: Shaders.terrainRingHeight.fragment
		});
	}
}
