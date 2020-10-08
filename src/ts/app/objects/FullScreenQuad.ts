import Mesh from "../../renderer/Mesh";
import Renderer from "../../renderer/Renderer";
import GLConstants from "../../renderer/GLConstants";

export default class FullScreenQuad extends Mesh {
	constructor(renderer: Renderer) {
		super(renderer, {
			vertices: new Float32Array([
				-1, 1, 0,
				-1, -1, 0,
				1, 1, 0,
				-1, -1, 0,
				1, -1, 0,
				1, 1, 0
			])
		});

		this.addAttribute({
			name: 'uv',
			size: 2,
			type: GLConstants.FLOAT,
			normalized: false
		});

		this.setAttributeData('uv', new Float32Array([
			0, 1,
			0, 0,
			1, 1,
			0, 0,
			1, 0,
			1, 1
		]));
	}
}