import Renderer from "./Renderer";

export default class VAO {
	private readonly gl: WebGL2RenderingContext;
	private readonly renderer: Renderer;
	private readonly vertexArrayObject: WebGLVertexArrayObject;

	public constructor(renderer: Renderer) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.vertexArrayObject = this.gl.createVertexArray();
	}

	public bind(): void {
		this.gl.bindVertexArray(this.vertexArrayObject);
	}

	public unbind(): void {
		this.gl.bindVertexArray(null);
	}

	public delete(): void {
		this.gl.deleteVertexArray(this.vertexArrayObject);
	}
}
