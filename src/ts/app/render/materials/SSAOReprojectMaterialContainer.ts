import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import {RendererTypes} from "~/renderer/RendererTypes";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import ResourceManager from "~/app/world/ResourceManager";

export default class SSAOReprojectMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'SSAO reproject material',
			uniforms: [
				{
					name: 'tNew',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tAccum',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tMotion',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tPrevDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
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
			vertexShaderSource: Shaders.ssaoReproject.vertex,
			fragmentShaderSource: Shaders.ssaoReproject.fragment
		});
	}
}
