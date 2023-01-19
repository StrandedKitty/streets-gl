import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";
import ShaderPrecompiler from "~/app/render/shaders/ShaderPrecompiler";

enum ShaderType {
	Vertex,
	Fragment
}

export default class WebGL2Program {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly name: string;
	private readonly fragmentShaderSource: string;
	private readonly vertexShaderSource: string;
	private readonly defines: Record<string, string>;
	public WebGLProgram: WebGLProgram;
	private fragmentShader: WebGLShader;
	private vertexShader: WebGLShader;

	public constructor(
		{
			renderer,
			vertexShaderSource,
			fragmentShaderSource,
			defines,
			name
		}: {
			renderer: WebGL2Renderer;
			vertexShaderSource: string;
			fragmentShaderSource: string;
			defines: Record<string, string>;
			name: string;
		}
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.vertexShaderSource = vertexShaderSource;
		this.fragmentShaderSource = fragmentShaderSource;
		this.defines = defines;
		this.name = name;

		this.createProgram();
	}

	private getShader(type: ShaderType): WebGLShader {
		const typeConstant = type === ShaderType.Vertex ? WebGL2Constants.VERTEX_SHADER : WebGL2Constants.FRAGMENT_SHADER;

		if (typeConstant === WebGL2Constants.FRAGMENT_SHADER) {
			if (!this.fragmentShader) {
				this.fragmentShader = this.gl.createShader(typeConstant);
			}

			return this.fragmentShader;
		} else if (typeConstant === WebGL2Constants.VERTEX_SHADER) {
			if (!this.vertexShader) {
				this.vertexShader = this.gl.createShader(typeConstant);
			}

			return this.vertexShader;
		}

		throw new Error();
	}

	private createProgram(): void {
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

	public recompileShaders(): void {
		const vertexShader = this.compileShader(ShaderType.Vertex, this.vertexShaderSource);
		const fragmentShader = this.compileShader(ShaderType.Fragment, this.fragmentShaderSource);
		//this.gl.attachShader(this.WebGLProgram, vertexShader);
		//this.gl.attachShader(this.WebGLProgram, fragmentShader);
		this.gl.linkProgram(this.WebGLProgram);
	}

	private compileShader(shaderType: ShaderType, source: string): WebGLShader {
		const name = this.name.replaceAll(' ', '_') + (shaderType === ShaderType.Vertex ? '_vert' : '_frag');
		source = ShaderPrecompiler.resolveNameAndDefines(source, name, this.defines);

		const shader = this.getShader(shaderType);

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