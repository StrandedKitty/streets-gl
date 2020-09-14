import Renderer from "./Renderer";

export default class WebGLCapabilities {
	private readonly gl: WebGL2RenderingContext;
	private readonly renderer: Renderer;

	constructor(renderer: Renderer) {
		this.gl = renderer.gl;
		this.renderer = renderer;
	}

	get maxAnisotropy(): number {
		const ext = this.renderer.extensions.get('texture_filter_anisotropic');

		if(ext !== null) {
			return this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		} else {
			return 1;
		}
	}
}

