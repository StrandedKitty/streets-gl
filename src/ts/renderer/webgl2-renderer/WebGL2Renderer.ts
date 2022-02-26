import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/renderer/webgl2-renderer/WebGL2Texture";
import WebGL2Extensions from "~/renderer/webgl2-renderer/WebGL2Extensions";
import WebGL2Texture2D from "~/renderer/webgl2-renderer/WebGL2Texture2D";
import AbstractTexture2DArray, {AbstractTexture2DArrayParams} from "~/renderer/abstract-renderer/AbstractTexture2DArray";
import WebGL2Texture2DArray from "~/renderer/webgl2-renderer/WebGL2Texture2DArray";
import AbstractTextureCube, {AbstractTextureCubeParams} from "~/renderer/abstract-renderer/AbstractTextureCube";
import WebGL2TextureCube from "~/renderer/webgl2-renderer/WebGL2TextureCube";
import AbstractMaterial, {AbstractMaterialParams} from "~/renderer/abstract-renderer/AbstractMaterial";
import WebGL2Material from "~/renderer/webgl2-renderer/WebGL2Material";
import AbstractAttribute, {AbstractAttributeParams} from "~/renderer/abstract-renderer/AbstractAttribute";
import WebGL2Attribute from "~/renderer/webgl2-renderer/WebGL2Attribute";
import AbstractMesh, {AbstractMeshParams} from "~/renderer/abstract-renderer/AbstractMesh";
import WebGL2Mesh from "~/renderer/webgl2-renderer/WebGL2Mesh";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Framebuffer from "~/renderer/webgl2-renderer/WebGL2Framebuffer";
import AbstractRenderPass, {AbstractRenderPassParams} from "~/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2RenderPass from "~/renderer/webgl2-renderer/WebGL2RenderPass";
import {RendererTypes} from "~/renderer/RendererTypes";

export default class WebGL2Renderer implements AbstractRenderer {
	public gl: WebGL2RenderingContext;
	public extensions: WebGL2Extensions;

	public boundTexture: WebGL2Texture = null;
	public boundMaterial: WebGL2Material = null;

	private frontFaceState: RendererTypes.FrontFace = RendererTypes.FrontFace.CCW;
	private cullingState: boolean = true;
	private cullingModeState: RendererTypes.CullMode = RendererTypes.CullMode.Back;
	private depthWriteState: boolean = true;
	private depthTestState: boolean = false;
	private depthFuncState: RendererTypes.DepthCompare = RendererTypes.DepthCompare.LessEqual;

	constructor(context: WebGL2RenderingContext) {
		this.gl = context;

		this.initExtensions();
	}

	private initExtensions() {
		this.extensions = {
			anisotropy: this.gl.getExtension("EXT_texture_filter_anisotropic"),
			floatRenderable: this.gl.getExtension("EXT_color_buffer_float"),
			debugInfo: this.gl.getExtension("WEBGL_debug_renderer_info"),
			floatLinear: this.gl.getExtension("OES_texture_float_linear"),
			timerQuery: this.gl.getExtension("EXT_disjoint_timer_query_webgl2")
		};
	}

	public bindTexture(texture: WebGL2Texture) {
		if (this.boundTexture !== texture) {
			texture.bind();

			this.boundTexture = texture;
		}
	}

	public unbindTexture() {
		if (this.boundTexture) {
			this.boundTexture.unbind();

			this.boundTexture = null;
		}
	}

	public createTexture2D(params: AbstractTexture2DParams): AbstractTexture2D {
		return new WebGL2Texture2D(this, params);
	}

	public createTexture2DArray(params: AbstractTexture2DArrayParams): AbstractTexture2DArray {
		return new WebGL2Texture2DArray(this, params);
	}

	public createTextureCube(params: AbstractTextureCubeParams): AbstractTextureCube {
		return new WebGL2TextureCube(this, params);
	}

	public createMaterial(params: AbstractMaterialParams): AbstractMaterial {
		return new WebGL2Material(this, params);
	}

	public createAttribute(params: AbstractAttributeParams): AbstractAttribute {
		return new WebGL2Attribute(this, params);
	}

	public createMesh(params: AbstractMeshParams): AbstractMesh {
		return new WebGL2Mesh(this, params);
	}

	public createRenderPass(params: AbstractRenderPassParams): AbstractRenderPass {
		return new WebGL2RenderPass(this, params);
	}

	public beginRenderPass(renderPass: WebGL2RenderPass) {
		renderPass.begin();
	}

	public useMaterial(material: WebGL2Material) {
		if (this.boundMaterial !== material) {
			material.use();

			this.culling = material.primitive.cullMode !== RendererTypes.CullMode.None;
			this.cullingMode = material.primitive.cullMode;
			this.frontFace = material.primitive.frontFace;
			this.depthTest = material.depth.depthCompare !== RendererTypes.DepthCompare.Always;
			this.depthFunc = material.depth.depthCompare;
			this.depthWrite = material.depth.depthWrite;

			this.boundMaterial = material;
		}
	}

	public set frontFace(state: RendererTypes.FrontFace) {
		if (this.frontFaceState === state) {
			return;
		}

		this.frontFaceState = state;

		if (state === RendererTypes.FrontFace.CCW) {
			this.gl.frontFace(WebGL2Constants.CCW);
		} else {
			this.gl.frontFace(WebGL2Constants.CW);
		}
	}

	public set culling(state: boolean) {
		if (this.cullingState === state) {
			return;
		}

		this.cullingState = state;

		if (state) {
			this.gl.enable(WebGL2Constants.CULL_FACE);
		} else {
			this.gl.disable(WebGL2Constants.CULL_FACE);
		}
	}

	public set cullingMode(state: RendererTypes.CullMode) {
		if (this.cullingModeState === state) {
			return;
		}

		this.cullingModeState = state;

		if (state === RendererTypes.CullMode.Front) {
			this.gl.cullFace(WebGL2Constants.FRONT);
		} else {
			this.gl.cullFace(WebGL2Constants.BACK);
		}
	}

	public set depthTest(state: boolean) {
		if (this.depthTestState === state) {
			return;
		}

		this.depthTestState = state;

		if (state) {
			this.gl.enable(WebGL2Constants.DEPTH_TEST);
		} else {
			this.gl.disable(WebGL2Constants.DEPTH_TEST);
		}
	}

	public set depthFunc(state: RendererTypes.DepthCompare) {
		if (this.depthFuncState === state) {
			return;
		}

		this.depthFuncState = state;

		switch (state) {
			case RendererTypes.DepthCompare.Never:
				this.gl.depthFunc(WebGL2Constants.NEVER);
				return;
			case RendererTypes.DepthCompare.Less:
				this.gl.depthFunc(WebGL2Constants.LESS);
				return;
			case RendererTypes.DepthCompare.Equal:
				this.gl.depthFunc(WebGL2Constants.EQUAL);
				return;
			case RendererTypes.DepthCompare.LessEqual:
				this.gl.depthFunc(WebGL2Constants.LEQUAL);
				return;
			case RendererTypes.DepthCompare.Greater:
				this.gl.depthFunc(WebGL2Constants.GREATER);
				return;
			case RendererTypes.DepthCompare.NotEqual:
				this.gl.depthFunc(WebGL2Constants.NOTEQUAL);
				return;
			case RendererTypes.DepthCompare.GreaterEqual:
				this.gl.depthFunc(WebGL2Constants.GEQUAL);
				return;
			case RendererTypes.DepthCompare.Always:
				this.gl.depthFunc(WebGL2Constants.ALWAYS);
				return;
		}
	}

	public set depthWrite(state: boolean) {
		if (this.depthWriteState === state) {
			return;
		}

		this.depthWriteState = state;

		this.gl.depthMask(state);
	}

	public setSize(width: number, height: number) {
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
	}

	public bindFramebuffer(framebuffer: WebGL2Framebuffer | null) {
		if (framebuffer) {
			framebuffer.bind();
		} else {
			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
			this.gl.bindFramebuffer(WebGL2Constants.FRAMEBUFFER, null);
		}
	}

	public get resolution(): { x: number, y: number } {
		return {
			x: this.gl.canvas.width,
			y: this.gl.canvas.height
		};
	}
}