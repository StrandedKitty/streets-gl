import Renderer from "./Renderer";
import GLConstants from "./GLConstants";
import Program from "./Program";

enum AttributeFormat {
	Float,
	Integer
}

export default class Attribute {
	private readonly gl: WebGL2RenderingContext;
	public readonly name: string;
	public readonly size: number;
	public readonly type: number;
	public readonly normalized: boolean;
	public readonly instanced: boolean;
	public readonly divisor: number;
	public readonly dataFormat: AttributeFormat;
	public readonly usage: number;
	public data: TypedArray;
	private location: number;
	private readonly buffer: WebGLBuffer;
	private program: Program;

	constructor(renderer: Renderer, {
		name,
		size = 3,
		type = GLConstants.FLOAT,
		normalized = false,
		instanced = false,
		divisor = 1,
		dataFormat = AttributeFormat.Float,
		usage = GLConstants.DYNAMIC_DRAW
	}: {
		name: string,
		size?: number,
		type?: number,
		normalized?: boolean,
		instanced?: boolean,
		divisor?: number,
		dataFormat?: AttributeFormat,
		usage?: number
	}) {
		this.gl = renderer.gl;
		this.name = name;
		this.size = size;
		this.type = type;
		this.normalized = normalized;
		this.instanced = instanced;
		this.divisor = divisor;
		this.dataFormat = dataFormat;
		this.usage = usage;
		this.data = null;
		this.location = null;

		this.buffer = this.gl.createBuffer();
	}

	public locate(program: Program) {
		this.program = program;

		this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.buffer);

		this.location = this.gl.getAttribLocation(this.program.WebGLProgram, this.name);

		if (this.location !== -1) {
			switch (this.dataFormat) {
				case AttributeFormat.Integer:
					this.gl.vertexAttribIPointer(this.location, this.size, this.type, 0, 0);
					break;
				case AttributeFormat.Float:
					this.gl.vertexAttribPointer(this.location, this.size, this.type, this.normalized, 0, 0);
					break;
			}

			if (this.instanced) {
				this.gl.vertexAttribDivisor(this.location, this.divisor);
			}

			this.gl.enableVertexAttribArray(this.location);
		}

		this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, null);
	}

	public setData(data: TypedArray) {
		this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(GLConstants.ARRAY_BUFFER, data, this.usage);
		this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, null);

		this.data = data;
	}

	public delete() {
		this.gl.deleteBuffer(this.buffer);
	}
}

export {AttributeFormat};
