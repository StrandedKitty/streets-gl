import WebGLCapabilities from "./WebGLCapabilities";
import Texture2D from "./Texture2D";
import Extensions from "./Extensions";
import Framebuffer from "./Framebuffer";
import GLConstants from "./GLConstants";
import Material from "./Material";
import GPUTimer from "./GPUTimer";

export default class Renderer {
	private readonly canvas: HTMLCanvasElement;
	public readonly gl: WebGL2RenderingContext;
	public extensions: Extensions;
	public capabilities: WebGLCapabilities;
	public gpuTimer: GPUTimer;
	public currentMaterial: Material;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		this.gl = canvas.getContext("webgl2", {antialias: false});
		if (!this.gl) {
			console.error('WebGL 2 is not available.');
			alert('WebGL 2 is not available.');
		}

		this.extensions = new Extensions(this.gl);
		this.capabilities = new WebGLCapabilities(this);
		this.gpuTimer = new GPUTimer(this);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.clearDepth(1);
	}

	public setSize(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	public bindFramebuffer(fb: Framebuffer) {
		if (fb instanceof Framebuffer) {
			this.gl.viewport(0, 0, fb.width, fb.height);
			this.gl.bindFramebuffer(GLConstants.FRAMEBUFFER, fb.WebGLFramebuffer);
		} else {
			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
			this.gl.bindFramebuffer(GLConstants.FRAMEBUFFER, null);
		}
	}

	public blitFramebuffer(
		{
			source,
			destination,
			readAttachment = 0,
			drawAttachment = 0,
			destinationWidth,
			destinationHeight,
			filter,
			depth = false
		}: {
			source: Framebuffer,
			destination: Framebuffer,
			readAttachment?: number,
			drawAttachment?: number,
			destinationWidth: number,
			destinationHeight: number,
			filter: number,
			depth: boolean
		}
	) {
		this.gl.bindFramebuffer(GLConstants.READ_FRAMEBUFFER, source.WebGLFramebuffer);

		if (destination === null) this.gl.bindFramebuffer(GLConstants.DRAW_FRAMEBUFFER, null);
		else this.gl.bindFramebuffer(GLConstants.DRAW_FRAMEBUFFER, destination.WebGLFramebuffer);

		this.gl.readBuffer(GLConstants.COLOR_ATTACHMENT0 + readAttachment);
		if (destination !== null) this.gl.drawBuffers(this.buildAttachmentsArray(drawAttachment));

		this.gl.blitFramebuffer(
			0, 0, source.width, source.height,
			0, 0, destinationWidth, destinationHeight,
			GLConstants.COLOR_BUFFER_BIT, filter
		);

		if (depth) this.gl.blitFramebuffer(
			0, 0, source.width, source.height,
			0, 0, destinationWidth, destinationHeight,
			GLConstants.DEPTH_BUFFER_BIT, GLConstants.NEAREST
		);

		this.gl.bindFramebuffer(GLConstants.READ_FRAMEBUFFER, null);
		this.gl.bindFramebuffer(GLConstants.DRAW_FRAMEBUFFER, null);
	}

	private buildAttachmentsArray(index: number): number[] {
		const attachments: number[] = [];

		for (let i = 0; i <= index; i++) {
			if (i === index)
				attachments.push(GLConstants.COLOR_ATTACHMENT0 + i);
			else
				attachments.push(GLConstants.NONE);
		}

		return attachments;
	}

	public copyFramebufferToTexture(fb: Framebuffer, texture: Texture2D, mipLevel: number = 0) {
		this.gl.bindFramebuffer(GLConstants.FRAMEBUFFER, fb.WebGLFramebuffer);
		this.gl.bindTexture(GLConstants.TEXTURE_2D, texture.WebGLTexture);
		this.gl.copyTexImage2D(GLConstants.TEXTURE_2D, mipLevel, texture.internalFormat, 0, 0, texture.width, texture.height, 0);
	}

	public clearColor(r: number, g: number, b: number, a: number) {
		this.gl.clearColor(r, g, b, a);
	}

	public clearFramebuffer(
		{
			clearColor,
			depthValue,
			color = false,
			depth = false
		}: {
			clearColor?: number[],
			depthValue?: number,
			color?: boolean,
			depth?: boolean
		}
	) {
		if(color)
			this.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

		if(depth)
			this.gl.clearDepth(depthValue);

		const colorBit = color ? this.gl.COLOR_BUFFER_BIT : 0;
		const depthBit = depth ? this.gl.DEPTH_BUFFER_BIT : 0;
		this.gl.clear(colorBit | depthBit);
	}

	public async fence(): Promise<void> {
		return new Promise((resolve) => {
			const sync = this.gl.fenceSync(GLConstants.SYNC_GPU_COMMANDS_COMPLETE, 0);

			this.gl.flush();

			const check = () => {
				const status = this.gl.getSyncParameter(sync, GLConstants.SYNC_STATUS);

				if (status == this.gl.SIGNALED) {
					this.gl.deleteSync(sync);
					resolve();
				} else {
					setTimeout(check, 0);
				}
			}

			setTimeout(check, 0);
		});
	}

	public set culling(state: boolean) {
		if (state)
			this.gl.enable(GLConstants.CULL_FACE);
		else
			this.gl.disable(GLConstants.CULL_FACE);
	}

	public set depthTest(state: boolean) {
		if (state)
			this.gl.enable(GLConstants.DEPTH_TEST);
		else
			this.gl.disable(GLConstants.DEPTH_TEST);
	}

	public set depthWrite(state: boolean) {
		this.gl.depthMask(state);
	}

	public get rendererInfo(): [string, string] {
		const ext = this.extensions.get('WEBGL_debug_renderer_info');

		if (ext !== null) {
			return [
				this.gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
				this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
			];
		}

		return [null, null];
	}
}

