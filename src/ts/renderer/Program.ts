import Renderer from "./Renderer";
import GLConstants from "./GLConstants";

interface ProgramSource {
	vertex: string,
	fragment: string
}

export default class Program {
	private readonly gl: WebGL2RenderingContext;
	public source: ProgramSource;
	private readonly fragmentShader: WebGLShader;
	private readonly vertexShader: WebGLShader;
	public WebGLProgram: WebGLProgram;

	constructor(renderer: Renderer, {
		vertexShader,
		fragmentShader
	}: {
		vertexShader: string,
		fragmentShader: string
	}) {
		this.gl = renderer.gl;

		this.source = {
			vertex: vertexShader,
			fragment: fragmentShader
		};

		this.vertexShader = this.createShader(GLConstants.VERTEX_SHADER, this.source.vertex);
		this.fragmentShader = this.createShader(GLConstants.FRAGMENT_SHADER, this.source.fragment);

		const program = this.gl.createProgram();

		this.gl.attachShader(program, this.vertexShader);
		this.gl.attachShader(program, this.fragmentShader);
		this.gl.linkProgram(program);

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			console.error(this.gl.getProgramInfoLog(program));
		}

		this.WebGLProgram = program;
	}

	private createShader(type: number, source: string): WebGLShader {
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		const compilationStatus = this.gl.getShaderParameter(shader, GLConstants.COMPILE_STATUS);

		if (!compilationStatus) {
			const compilationLog = this.gl.getShaderInfoLog(shader);
			console.error((type === GLConstants.VERTEX_SHADER ? 'Vertex' : 'Fragment') + ' shader compilation error\n\n' + compilationLog + '\n%c' + source, 'color: #111');
		}

		return shader;
	}
}
