import AbstractAttributeBuffer, {
	AbstractAttributeBufferParams
} from "~/lib/renderer/abstract-renderer/AbstractAttributeBuffer";
import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";

export default class WebGL2AttributeBuffer implements AbstractAttributeBuffer {
	private readonly renderer: WebGL2Renderer;
	private readonly usage: RendererTypes.BufferUsage;
	public buffer: WebGLBuffer;
	public data: TypedArray;

	public constructor(
		renderer: WebGL2Renderer,
		{
			usage = RendererTypes.BufferUsage.StaticDraw,
			data = null
		}: AbstractAttributeBufferParams
	) {
		this.renderer = renderer;
		this.usage = usage;
		this.data = data;

		this.createBuffer();

		if (data) {
			this.setData(data);
		}
	}

	private createBuffer(): void {
		this.buffer = this.renderer.gl.createBuffer();
	}

	public setData(data: TypedArray): void {
		this.data = data;

		const usage = WebGL2AttributeBuffer.convertUsageToWebGLConstant(this.usage);

		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, this.buffer);
		this.renderer.gl.bufferData(WebGL2Constants.ARRAY_BUFFER, data, usage);
		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, null);
	}

	public bind(): void {
		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, this.buffer);
	}

	public unbind(): void {
		this.renderer.gl.bindBuffer(WebGL2Constants.ARRAY_BUFFER, null);
	}

	public delete(): void {
		this.renderer.gl.deleteBuffer(this.buffer);
		this.buffer = null;
	}

	public static convertUsageToWebGLConstant(usage: RendererTypes.BufferUsage): number {
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
}