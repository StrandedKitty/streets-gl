import Shaders from "../shaders/Shaders";
import MaterialContainer from "~/app/render/materials/MaterialContainer";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/renderer/RendererTypes";

export default class SelectionBlurMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		this.material = this.renderer.createMaterial({
			name: 'Selection blur material',
			uniforms: [
				{
					name: 'tMap',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'direction',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Float2,
					value: new Float32Array(2)
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
			vertexShaderSource: Shaders.selectionBlur.vertex,
			fragmentShaderSource: Shaders.selectionBlur.fragment
		});
	}
}