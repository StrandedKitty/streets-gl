import WebGL2Program from "~/renderer/webgl2-renderer/WebGL2Program";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import {Uniform} from "~/renderer/abstract-renderer/Uniform";

function equal (buf1: TypedArray, buf2: TypedArray): boolean {
	if (buf1.byteLength != buf2.byteLength) return false;
	const dv1 = new Int8Array(buf1.buffer);
	const dv2 = new Int8Array(buf2.buffer);
	for (let i = 0 ; i != buf1.byteLength ; i++)
	{
		if (dv1[i] != dv2[i]) return false;
	}
	return true;
}

export default class WebGL2UBO {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly program: WebGL2Program;
	private readonly blockName: string;
	private readonly uniforms: Uniform[];
	private buffer: WebGLBuffer;
	private blockIndex: number;
	private uniformsOffsets: Map<string, number> = new Map();
	private savedUniformValues: Map<string, TypedArray> = new Map();

	constructor(renderer: WebGL2Renderer, program: WebGL2Program, blockName: string, uniforms: Uniform[]) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.program = program;
		this.blockName = blockName;
		this.uniforms = uniforms;

		this.createBuffer();
	}

	private createBuffer() {
		const blockIndex = this.gl.getUniformBlockIndex(this.program.WebGLProgram, this.blockName);

		const blockSize = this.gl.getActiveUniformBlockParameter(
			this.program.WebGLProgram,
			blockIndex,
			WebGL2Constants.UNIFORM_BLOCK_DATA_SIZE
		);

		this.buffer = this.gl.createBuffer();

		this.gl.bindBuffer(WebGL2Constants.UNIFORM_BUFFER, this.buffer);
		this.gl.bufferData(WebGL2Constants.UNIFORM_BUFFER, blockSize, WebGL2Constants.STATIC_DRAW);

		this.blockIndex = blockIndex;

		const variableIndices = this.gl.getUniformIndices(
			this.program.WebGLProgram,
			this.uniforms.map(u => u.name)
		);

		const variableOffsets = this.gl.getActiveUniforms(
			this.program.WebGLProgram,
			variableIndices,
			WebGL2Constants.UNIFORM_OFFSET
		);

		for (let i = 0; i < this.uniforms.length; i++) {
			this.uniformsOffsets.set(this.uniforms[i].name, variableOffsets[i]);

			this.setUniformValue(this.uniforms[i].name, <TypedArray>this.uniforms[i].value);
		}
	}

	private bind() {
		this.gl.bindBuffer(WebGL2Constants.UNIFORM_BUFFER, this.buffer);
	}

	public bindToBindingPoint(bindingPoint: number) {
		this.gl.bindBufferBase(WebGL2Constants.UNIFORM_BUFFER, bindingPoint, this.buffer);

		this.gl.uniformBlockBinding(this.program.WebGLProgram, this.blockIndex, bindingPoint);
	}

	public setUniformValue(uniformName: string, value: TypedArray) {
		const savedValue = this.savedUniformValues.get(uniformName);

		if (savedValue && equal(savedValue, value)) {
			return;
		}

		this.bind();

		this.gl.bufferSubData(
			WebGL2Constants.UNIFORM_BUFFER,
			this.uniformsOffsets.get(uniformName),
			value,
			0
		);

		this.savedUniformValues.set(uniformName, value);
	}
}