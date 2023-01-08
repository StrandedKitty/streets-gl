import WebGL2Program from "~/renderer/webgl2-renderer/WebGL2Program";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import {Uniform} from "~/renderer/abstract-renderer/Uniform";

function equal(buf1: TypedArray, buf2: TypedArray): boolean {
	if (buf1.byteLength != buf2.byteLength) return false;

	const dv1 = new Int8Array(buf1.buffer);
	const dv2 = new Int8Array(buf2.buffer);

	for (let i = 0; i != buf1.byteLength; i++) {
		if (dv1[i] != dv2[i]) return false;
	}

	return true;
}

const areEqual = (first: TypedArray, second: TypedArray): boolean => {
	return first.length === second.length && first.every((value, index) => value === second[index]);
}

export default class WebGL2UBO {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	private readonly program: WebGL2Program;
	private readonly blockIndex: number;
	private readonly offsetMap: Map<string, number> = new Map();
	public blockName: string;
	public blockSize: number;
	private buffer: WebGLBuffer;
	private data: ArrayBuffer;
	private dataView: Uint8Array;

	public constructor(renderer: WebGL2Renderer, program: WebGL2Program, blockIndex: number) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.program = program;
		this.blockIndex = blockIndex;

		this.createBuffer();
	}

	private createBuffer(): void  {
		this.blockName = this.gl.getActiveUniformBlockName(this.program.WebGLProgram, this.blockIndex);
		this.blockSize = this.gl.getActiveUniformBlockParameter(
			this.program.WebGLProgram,
			this.blockIndex,
			WebGL2Constants.UNIFORM_BLOCK_DATA_SIZE
		);

		this.buffer = this.gl.createBuffer();

		this.gl.bindBuffer(WebGL2Constants.UNIFORM_BUFFER, this.buffer);
		this.gl.bufferData(WebGL2Constants.UNIFORM_BUFFER, this.blockSize, WebGL2Constants.STATIC_DRAW);

		this.data = new ArrayBuffer(this.blockSize);
		this.dataView = new Uint8Array(this.data);

		const indices: Uint32Array = this.gl.getActiveUniformBlockParameter(
			this.program.WebGLProgram,
			this.blockIndex,
			WebGL2Constants.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES
		);

		const offsets = this.gl.getActiveUniforms(
			this.program.WebGLProgram,
			Array.from(indices),
			WebGL2Constants.UNIFORM_OFFSET
		);

		for (let i = 0; i < indices.length; i++) {
			const info = this.gl.getActiveUniform(this.program.WebGLProgram, indices[i]);

			this.offsetMap.set(info.name, offsets[i]);
		}
	}

	private bind(): void  {
		this.gl.bindBuffer(WebGL2Constants.UNIFORM_BUFFER, this.buffer);
	}

	public bindToBindingPoint(bindingPoint: number): void  {
		this.gl.bindBufferBase(WebGL2Constants.UNIFORM_BUFFER, bindingPoint, this.buffer);

		this.gl.uniformBlockBinding(this.program.WebGLProgram, this.blockIndex, bindingPoint);
	}

	public setUniformValue(uniformName: string, value: TypedArray): void  {
		const offset = this.offsetMap.get(uniformName);

		if (offset === undefined) {
			throw new Error(`Uniform ${uniformName} in block ${this.blockName} is not present in the shader`);
		}

		this.dataView.set(new Uint8Array(value.buffer), offset);
	}

	public applyUpdates(): void {
		this.bind();

		this.gl.bufferSubData(
			WebGL2Constants.UNIFORM_BUFFER,
			0,
			this.data
		);
	}
}