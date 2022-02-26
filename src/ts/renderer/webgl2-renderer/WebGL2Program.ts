import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";

enum ShaderType {
	Vertex,
	Fragment
}

export default class WebGL2Program {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly fragmentShaderSource: string;
	private readonly vertexShaderSource: string;
	public WebGLProgram: WebGLProgram;

	constructor(renderer: WebGL2Renderer, vertexShaderSource: string, fragmentShaderSource: string) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.vertexShaderSource = vertexShaderSource;
		this.fragmentShaderSource = fragmentShaderSource;

		this.createProgram();
	}

	private createProgram() {
		const vertexShader = this.compileShader(ShaderType.Vertex, this.vertexShaderSource);
		const fragmentShader = this.compileShader(ShaderType.Fragment, this.fragmentShaderSource);

		const program = this.gl.createProgram();

		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		if (!this.gl.getProgramParameter(program, WebGL2Constants.LINK_STATUS)) {
			console.error(this.gl.getProgramInfoLog(program));
		}

		this.WebGLProgram = program;
	}

	private compileShader(shaderType: ShaderType, source: string): WebGLShader {
		const typeConstant = shaderType === ShaderType.Vertex ? WebGL2Constants.VERTEX_SHADER : WebGL2Constants.FRAGMENT_SHADER;

		const shader = this.gl.createShader(typeConstant);

		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		const compilationStatus = this.gl.getShaderParameter(shader, WebGL2Constants.COMPILE_STATUS);

		if (!compilationStatus) {
			const compilationLog = this.gl.getShaderInfoLog(shader);
			const formattedSource = this.formatShaderSource(source);
			const shaderTypeString = shaderType === ShaderType.Vertex ? 'Vertex' : 'Fragment';

			console.error(`${shaderTypeString} shader compilation error\n\n${compilationLog}\n%c${formattedSource}`, 'color: #111');
		}

		return shader;
	}

	private formatShaderSource(source: string): string {
		const sourceLines = source.split('\n');
		const maxFigures = Math.ceil(Math.log10(sourceLines.length));
		const sourceLinesWithLineNumbers = sourceLines.map((line, i) => {
			return `${(i + 1).toString().padEnd(maxFigures)}  ${line}`;
		})

		return sourceLinesWithLineNumbers.join('\n');
	}
}