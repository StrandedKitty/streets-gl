import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/renderer/RendererTypes";

export default class BuildingMaskMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Building mask material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'selectedId',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Uint1,
					value: new Uint32Array(1)
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
			vertexShaderSource: Shaders.buildingMask.vertex,
			fragmentShaderSource: Shaders.buildingMask.fragment
		});
	}
}