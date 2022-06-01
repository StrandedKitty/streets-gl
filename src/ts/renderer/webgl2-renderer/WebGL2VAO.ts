import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";

export default class WebGL2VAO {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly vertexArrayObject: WebGLVertexArrayObject;

	public constructor(renderer: WebGL2Renderer) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.vertexArrayObject = this.gl.createVertexArray();
	}

	public bind(): void  {
		this.gl.bindVertexArray(this.vertexArrayObject);
	}

	public delete(): void  {
		this.gl.deleteVertexArray(this.vertexArrayObject);
	}
}