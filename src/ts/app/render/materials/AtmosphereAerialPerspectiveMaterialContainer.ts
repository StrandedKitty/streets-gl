import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import UniformType = RendererTypes.UniformType;

export default class AtmosphereAerialPerspectiveMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Atmosphere aerial perspective 3D LUT material',
			uniforms: [
				{
					name: 'tTransmittanceLUT',
					block: null,
					type: UniformType.Texture2D,
					value: null
				}, {
					name: 'tMultipleScatteringLUT',
					block: null,
					type: UniformType.Texture2D,
					value: null
				}, {
					name: 'projectionMatrixInverse',
					block: 'Common',
					type: UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'viewMatrixInverse',
					block: 'Common',
					type: UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'cameraPosition',
					block: 'Common',
					type: UniformType.Float3,
					value: new Float32Array(3)
				}, {
					name: 'sunDirection',
					block: 'Common',
					type: UniformType.Float3,
					value: new Float32Array(3)
				}, {
					name: 'sliceIndexOffset',
					block: 'PerDraw',
					type: UniformType.Float1,
					value: new Float32Array(1)
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
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				},
				alpha: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				}
			},
			vertexShaderSource: Shaders.atmosphereAerialPerspective.vertex,
			fragmentShaderSource: Shaders.atmosphereAerialPerspective.fragment
		});
	}
}
