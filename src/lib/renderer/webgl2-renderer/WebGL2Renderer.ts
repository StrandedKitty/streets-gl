import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {AbstractTexture2DParams} from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import WebGL2Texture from "~/lib/renderer/webgl2-renderer/WebGL2Texture";
import WebGL2Extensions from "~/lib/renderer/webgl2-renderer/WebGL2Extensions";
import WebGL2Texture2D from "~/lib/renderer/webgl2-renderer/WebGL2Texture2D";
import {AbstractTexture2DArrayParams} from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import WebGL2Texture2DArray from "~/lib/renderer/webgl2-renderer/WebGL2Texture2DArray";
import {AbstractTextureCubeParams} from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import WebGL2TextureCube from "~/lib/renderer/webgl2-renderer/WebGL2TextureCube";
import {AbstractMaterialBlendParams, AbstractMaterialParams} from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import WebGL2Material from "~/lib/renderer/webgl2-renderer/WebGL2Material";
import {AbstractAttributeParams} from "~/lib/renderer/abstract-renderer/AbstractAttribute";
import WebGL2Attribute from "~/lib/renderer/webgl2-renderer/WebGL2Attribute";
import {AbstractMeshParams} from "~/lib/renderer/abstract-renderer/AbstractMesh";
import WebGL2Mesh from "~/lib/renderer/webgl2-renderer/WebGL2Mesh";
import WebGL2Constants from "~/lib/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Framebuffer from "~/lib/renderer/webgl2-renderer/WebGL2Framebuffer";
import {AbstractRenderPassParams} from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2RenderPass from "~/lib/renderer/webgl2-renderer/WebGL2RenderPass";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {AbstractTexture3DParams} from "~/lib/renderer/abstract-renderer/AbstractTexture3D";
import WebGL2Texture3D from "~/lib/renderer/webgl2-renderer/WebGL2Texture3D";
import {AbstractAttributeBufferParams} from "~/lib/renderer/abstract-renderer/AbstractAttributeBuffer";
import WebGL2AttributeBuffer from "~/lib/renderer/webgl2-renderer/WebGL2AttributeBuffer";

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
	private depthBiasEnabled: boolean = false;
	private depthBiasConstant: number = 0;
	private depthBiasSlopeScale: number = 0;
	private blendOperationsState: [number, number] = [
		WebGL2Constants.FUNC_ADD,
		WebGL2Constants.FUNC_ADD
	];
	private blendFactorsState: [number, number, number, number] = [
		WebGL2Constants.ONE,
		WebGL2Constants.ZERO,
		WebGL2Constants.ONE,
		WebGL2Constants.ZERO
	];

	private timerQuery: WebGLQuery = null;

	public constructor(context: WebGL2RenderingContext) {
		this.gl = context;

		this.gl.enable(WebGL2Constants.BLEND);

		this.initExtensions();
	}

	private initExtensions(): void {
		this.extensions = {
			anisotropy: this.gl.getExtension("EXT_texture_filter_anisotropic"),
			floatRenderable: this.gl.getExtension("EXT_color_buffer_float"),
			floatLinear: this.gl.getExtension("OES_texture_float_linear"),
			timerQuery: this.gl.getExtension("EXT_disjoint_timer_query_webgl2"),
			rendererInfo: this.gl.getExtension("WEBGL_debug_renderer_info")
		};
	}

	public bindTexture(texture: WebGL2Texture): void {
		if (this.boundTexture !== texture) {
			texture.bind();

			this.boundTexture = texture;
		}
	}

	public unbindTexture(): void {
		if (this.boundTexture) {
			this.boundTexture.unbind();

			this.boundTexture = null;
		}
	}

	public createTexture2D(params: AbstractTexture2DParams): WebGL2Texture2D {
		return new WebGL2Texture2D(this, params);
	}

	public createTexture2DArray(params: AbstractTexture2DArrayParams): WebGL2Texture2DArray {
		return new WebGL2Texture2DArray(this, params);
	}

	public createTexture3D(params: AbstractTexture3DParams): WebGL2Texture3D {
		return new WebGL2Texture3D(this, params);
	}

	public createTextureCube(params: AbstractTextureCubeParams): WebGL2TextureCube {
		return new WebGL2TextureCube(this, params);
	}

	public createMaterial(params: AbstractMaterialParams): WebGL2Material {
		return new WebGL2Material(this, params);
	}

	public createAttribute(params: AbstractAttributeParams): WebGL2Attribute {
		return new WebGL2Attribute(this, params);
	}

	public createAttributeBuffer(params: AbstractAttributeBufferParams = {}): WebGL2AttributeBuffer {
		return new WebGL2AttributeBuffer(this, params);
	}

	public createMesh(params: AbstractMeshParams): WebGL2Mesh {
		return new WebGL2Mesh(this, params);
	}

	public createRenderPass(params: AbstractRenderPassParams): WebGL2RenderPass {
		return new WebGL2RenderPass(this, params);
	}

	public beginRenderPass(renderPass: WebGL2RenderPass): void {
		renderPass.begin();
	}

	public useMaterial(material: WebGL2Material): void {
		if (this.boundMaterial !== material) {
			material.use();

			this.culling = material.primitive.cullMode !== RendererTypes.CullMode.None;
			this.cullingMode = material.primitive.cullMode;
			this.frontFace = material.primitive.frontFace;
			this.depthTest = material.depth.depthCompare !== RendererTypes.DepthCompare.Always;
			this.depthFunc = material.depth.depthCompare;
			this.depthWrite = material.depth.depthWrite;
			this.setDepthBias(material.depth.depthBiasSlopeScale, material.depth.depthBiasConstant);
			this.setBlend(material.blend);

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

	public get depthWrite(): boolean {
		return this.depthWriteState;
	}

	public setDepthBias(depthBiasSlopeScale: number, depthBiasConstant: number): void {
		const depthBiasEnabled = depthBiasSlopeScale !== undefined || depthBiasConstant !== undefined;

		if (depthBiasEnabled !== this.depthBiasEnabled) {
			if (depthBiasEnabled) {
				this.gl.enable(WebGL2Constants.POLYGON_OFFSET_FILL);
			} else {
				this.gl.disable(WebGL2Constants.POLYGON_OFFSET_FILL);
			}

			this.depthBiasEnabled = depthBiasEnabled;
		}

		if (depthBiasSlopeScale !== this.depthBiasSlopeScale || depthBiasConstant !== this.depthBiasConstant) {
			this.gl.polygonOffset(depthBiasConstant, depthBiasSlopeScale);

			this.depthBiasSlopeScale = depthBiasSlopeScale;
			this.depthBiasConstant = depthBiasConstant;
		}
	}

	public setBlend(blend: AbstractMaterialBlendParams): void {
		const newBlendOperations: [number, number] = [
			WebGL2Renderer.convertBlendOperationToWebGLConstant(blend.color.operation),
			WebGL2Renderer.convertBlendOperationToWebGLConstant(blend.alpha.operation)
		];
		const newBlendFactors: [number, number, number, number] = [
			WebGL2Renderer.convertBlendFactorToWebGLConstant(blend.color.srcFactor),
			WebGL2Renderer.convertBlendFactorToWebGLConstant(blend.color.dstFactor),
			WebGL2Renderer.convertBlendFactorToWebGLConstant(blend.alpha.srcFactor),
			WebGL2Renderer.convertBlendFactorToWebGLConstant(blend.alpha.dstFactor)
		];
		let blendOperationsNeedUpdate = false;
		let blendFactorsNeedUpdate = false;

		for (let i = 0; i < this.blendOperationsState.length; i++) {
			if (this.blendOperationsState[i] !== newBlendOperations[i]) {
				blendOperationsNeedUpdate = true;
				break;
			}
		}
		for (let i = 0; i < this.blendFactorsState.length; i++) {
			if (this.blendFactorsState[i] !== newBlendFactors[i]) {
				blendFactorsNeedUpdate = true;
				break;
			}
		}

		if (blendOperationsNeedUpdate) {
			this.blendOperationsState = newBlendOperations;
			this.gl.blendEquationSeparate(this.blendOperationsState[0], this.blendOperationsState[1]);
		}

		if (blendFactorsNeedUpdate) {
			this.blendFactorsState = newBlendFactors;
			this.gl.blendFuncSeparate(
				this.blendFactorsState[0],
				this.blendFactorsState[1],
				this.blendFactorsState[2],
				this.blendFactorsState[3]
			);
		}
	}

	public setSize(width: number, height: number): void {
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
	}

	public bindFramebuffer(framebuffer: WebGL2Framebuffer | null): void {
		if (framebuffer) {
			framebuffer.bind();
		} else {
			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
			this.gl.bindFramebuffer(WebGL2Constants.FRAMEBUFFER, null);
		}
	}

	public get rendererInfo(): [string, string] {
		const ext = this.extensions.rendererInfo;

		if (ext !== null) {
			return [
				this.gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
				this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
			];
		}

		return ['WEBGL_debug_renderer_info is not available', ''];
	}

	public async fence(): Promise<void> {
		return new Promise((resolve) => {
			const sync = this.gl.fenceSync(WebGL2Constants.SYNC_GPU_COMMANDS_COMPLETE, 0);

			this.gl.flush();

			const check = (): void => {
				const status = this.gl.getSyncParameter(sync, WebGL2Constants.SYNC_STATUS);

				if (status == this.gl.SIGNALED) {
					this.gl.deleteSync(sync);
					resolve();
				} else {
					setTimeout(check, 0);
				}
			};

			setTimeout(check, 0);
		});
	}

	public startTimer(): void {
		this.timerQuery = this.gl.createQuery();
		this.gl.beginQuery(this.extensions.timerQuery.TIME_ELAPSED_EXT, this.timerQuery);
	}

	public finishTimer(): Promise<number> {
		this.gl.endQuery(this.extensions.timerQuery.TIME_ELAPSED_EXT);

		const query = this.timerQuery;

		return new Promise<number>(resolve => {
			setTimeout(() => {
				const available = this.gl.getQueryParameter(query, WebGL2Constants.QUERY_RESULT_AVAILABLE);
				const disjoint = this.gl.getParameter(this.extensions.timerQuery.GPU_DISJOINT_EXT);
				let result = 0;

				if (available && !disjoint) {
					const timeElapsed = this.gl.getQueryParameter(query, WebGL2Constants.QUERY_RESULT);
					result = +(timeElapsed / 1e6).toFixed(3);
				}

				this.gl.deleteQuery(query);

				resolve(result);
			}, 1000);
		});
	}

	public get resolution(): {x: number; y: number} {
		return {
			x: this.gl.canvas.width,
			y: this.gl.canvas.height
		};
	}

	public static convertBlendOperationToWebGLConstant(blendOperation: RendererTypes.BlendOperation): number {
		switch (blendOperation) {
			case RendererTypes.BlendOperation.Add:
				return WebGL2Constants.FUNC_ADD;
			case RendererTypes.BlendOperation.Subtract:
				return WebGL2Constants.FUNC_SUBTRACT;
			case RendererTypes.BlendOperation.ReverseSubtract:
				return WebGL2Constants.FUNC_REVERSE_SUBTRACT;
			case RendererTypes.BlendOperation.Min:
				return WebGL2Constants.MIN;
			case RendererTypes.BlendOperation.Max:
				return WebGL2Constants.MAX;
		}
	}

	public static convertBlendFactorToWebGLConstant(blandFactor: RendererTypes.BlendFactor): number {
		switch (blandFactor) {
			case RendererTypes.BlendFactor.Zero:
				return WebGL2Constants.ZERO;
			case RendererTypes.BlendFactor.One:
				return WebGL2Constants.ONE;
			case RendererTypes.BlendFactor.Src:
				return WebGL2Constants.SRC_COLOR;
			case RendererTypes.BlendFactor.OneMinusSrc:
				return WebGL2Constants.ONE_MINUS_SRC_COLOR;
			case RendererTypes.BlendFactor.SrcAlpha:
				return WebGL2Constants.SRC_ALPHA;
			case RendererTypes.BlendFactor.OneMinusSrcAlpha:
				return WebGL2Constants.ONE_MINUS_SRC_ALPHA;
			case RendererTypes.BlendFactor.Dst:
				return WebGL2Constants.DST_COLOR;
			case RendererTypes.BlendFactor.OneMinusDst:
				return WebGL2Constants.ONE_MINUS_DST_COLOR;
			case RendererTypes.BlendFactor.DstAlpha:
				return WebGL2Constants.DST_ALPHA;
			case RendererTypes.BlendFactor.OneMinusDstAlpha:
				return WebGL2Constants.ONE_MINUS_DST_ALPHA;
		}
	}
}