import AbstractAttribute, {AbstractAttributeParams} from "~/lib/renderer/abstract-renderer/AbstractAttribute";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Program from "./WebGL2Program";
import WebGL2AttributeBuffer from "~/lib/renderer/webgl2-renderer/WebGL2AttributeBuffer";

export default class WebGL2Attribute implements AbstractAttribute {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	public readonly buffer: WebGL2AttributeBuffer;
	public divisor: number;
	public instanced: boolean;
	public name: string;
	public normalized: boolean;
	public size: number;
	public stride: number;
	public offset: number;
	public type: RendererTypes.AttributeType;
	public format: RendererTypes.AttributeFormat;

	public constructor(
		renderer: WebGL2Renderer,
		{
			name,
			size,
			type,
			format,
			normalized,
			instanced = false,
			divisor = 1,
			stride = 0,
			offset = 0,
			buffer
		}: AbstractAttributeParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.name = name;
		this.size = size;
		this.type = type;
		this.format = format;
		this.normalized = normalized;
		this.instanced = instanced;
		this.divisor = divisor;
		this.offset = offset;
		this.stride = stride;
		this.buffer = buffer as WebGL2AttributeBuffer;
	}

	public locate(program: WebGL2Program): void {
		const location = this.gl.getAttribLocation(program.WebGLProgram, this.name);

		if (location !== -1) {
			this.buffer.bind();

			const typeConstant = WebGL2Attribute.convertTypeToWebGLConstant(this.type);
			this.gl.enableVertexAttribArray(location);

			switch (this.format) {
				case RendererTypes.AttributeFormat.Integer:
					this.gl.vertexAttribIPointer(location, this.size, typeConstant, this.stride, this.offset);
					break;
				case RendererTypes.AttributeFormat.Float:
					this.gl.vertexAttribPointer(location, this.size, typeConstant, this.normalized, this.stride, this.offset);
					break;
			}

			if (this.instanced) {
				this.gl.vertexAttribDivisor(location, this.divisor);
			}

			this.gl.enableVertexAttribArray(location);

			this.buffer.unbind();
		}
	}

	public delete(): void {

	}

	public static convertTypeToWebGLConstant(type: RendererTypes.AttributeType): number {
		switch (type) {
			case RendererTypes.AttributeType.UnsignedByte:
				return WebGL2Constants.UNSIGNED_BYTE;
			case RendererTypes.AttributeType.Float32:
				return WebGL2Constants.FLOAT;
			case RendererTypes.AttributeType.UnsignedInt:
				return WebGL2Constants.UNSIGNED_INT;
		}

		return WebGL2Constants.UNSIGNED_BYTE;
	}
}