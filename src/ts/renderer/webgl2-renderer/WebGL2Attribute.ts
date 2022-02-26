import AbstractAttribute, {AbstractAttributeParams} from "~/renderer/abstract-renderer/AbstractAttribute";
import {RendererTypes} from "~/renderer/RendererTypes";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import GLConstants from "~/renderer/GLConstants";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Program from "./WebGL2Program";

export default class WebGL2Attribute implements AbstractAttribute {
	private renderer: WebGL2Renderer;
	private gl: WebGL2RenderingContext;
	public divisor: number;
	public instanced: boolean;
	public name: string;
	public normalized: boolean;
	public size: number;
	public type: RendererTypes.AttributeType;
	public usage: RendererTypes.BufferUsage;
	public data: TypedArray;
	private buffer: WebGLBuffer;

	constructor(
		renderer: WebGL2Renderer,
		{
			name,
			size,
			type,
			usage = RendererTypes.BufferUsage.StaticDraw,
			normalized,
			instanced = false,
			divisor = 1,
			data = null
		}: AbstractAttributeParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.name = name;
		this.size = size;
		this.type = type;
		this.usage = usage;
		this.normalized = normalized;
		this.instanced = instanced;
		this.divisor = divisor;
		this.data = data;

		this.createBuffer();
	}

	private createBuffer() {
		this.buffer = this.gl.createBuffer();

		this.setData(this.data);
	}

	public locate(program: WebGL2Program) {
		const location = this.gl.getAttribLocation(program.WebGLProgram, this.name);

		if (location !== -1) {
			this.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, this.buffer);

			/*switch (this.dataFormat) {
				case AttributeFormat.Integer:
					this.gl.vertexAttribIPointer(this.location, this.size, this.type, 0, 0);
					break;
				case AttributeFormat.Float:
					this.gl.vertexAttribPointer(this.location, this.size, this.type, this.normalized, 0, 0);
					break;
			}*/

			const typeConstant = WebGL2Attribute.convertTypeToWebGLConstant(this.type);
			this.gl.enableVertexAttribArray(location);

			this.gl.vertexAttribPointer(location, this.size, typeConstant, this.normalized, 0, 0);

			if (this.instanced) {
				this.gl.vertexAttribDivisor(location, this.divisor);
			}

			this.gl.enableVertexAttribArray(location);

			this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, null);
		}
	}

	public setData(data: TypedArray) {
		this.data = data;

		const usage = WebGL2Attribute.convertUsageToWebGLConstant(this.usage);

		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, this.buffer);
		this.renderer.gl.bufferData(WebGL2Constants.ARRAY_BUFFER, data, usage);
		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, null);
	}

	static convertUsageToWebGLConstant(usage: RendererTypes.BufferUsage): number {
		switch (usage) {
			case RendererTypes.BufferUsage.StaticDraw:
				return WebGL2Constants.STATIC_DRAW;
			case RendererTypes.BufferUsage.DynamicDraw:
				return WebGL2Constants.DYNAMIC_DRAW;
			case RendererTypes.BufferUsage.StreamDraw:
				return WebGL2Constants.STREAM_DRAW;
			case RendererTypes.BufferUsage.StaticRead:
				return WebGL2Constants.STATIC_READ;
			case RendererTypes.BufferUsage.DynamicRead:
				return WebGL2Constants.DYNAMIC_READ;
			case RendererTypes.BufferUsage.StreamRead:
				return WebGL2Constants.STREAM_READ;
			case RendererTypes.BufferUsage.StaticCopy:
				return WebGL2Constants.STATIC_COPY;
			case RendererTypes.BufferUsage.DynamicCopy:
				return WebGL2Constants.DYNAMIC_COPY;
			case RendererTypes.BufferUsage.StreamCopy:
				return WebGL2Constants.STREAM_COPY;
		}
	}

	static convertTypeToWebGLConstant(type: RendererTypes.AttributeType): number {
		switch (type) {
			case RendererTypes.AttributeType.UnsignedByte:
				return WebGL2Constants.UNSIGNED_BYTE;
			case RendererTypes.AttributeType.Float32:
				return WebGL2Constants.FLOAT;
		}

		return WebGL2Constants.UNSIGNED_BYTE;
	}
}