import Renderer from "./Renderer";

export default class VAO {
	private readonly gl: WebGL2RenderingContext;
	private readonly renderer: Renderer;
	private readonly vertexArrayObject: WebGLVertexArrayObject;

	constructor(renderer: Renderer) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.vertexArrayObject = this.gl.createVertexArray();
	}

	public bind() {
		this.gl.bindVertexArray(this.vertexArrayObject);
	}

	public unbind() {
		this.gl.bindVertexArray(null);
	}

	public delete() {
		this.gl.deleteVertexArray(this.vertexArrayObject);
	}
}
