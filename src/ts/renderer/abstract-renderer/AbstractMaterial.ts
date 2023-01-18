import {Uniform} from "~/renderer/abstract-renderer/Uniform";
import {RendererTypes} from "~/renderer/RendererTypes";

export interface AbstractMaterialPrimitiveParams {
	frontFace: RendererTypes.FrontFace;
	cullMode: RendererTypes.CullMode;
}

export interface AbstractMaterialDepthParams {
	depthWrite: boolean;
	depthCompare: RendererTypes.DepthCompare;
	depthBiasSlopeScale?: number;
	depthBiasConstant?: number;
}

interface AbstractMaterialBlendParamsComponent {
	operation: RendererTypes.BlendOperation;
	srcFactor: RendererTypes.BlendFactor;
	dstFactor: RendererTypes.BlendFactor;
}

export interface AbstractMaterialBlendParams {
	color: AbstractMaterialBlendParamsComponent;
	alpha: AbstractMaterialBlendParamsComponent;
}

export interface AbstractMaterialParams {
	name: string;
	vertexShaderSource: string;
	fragmentShaderSource: string;
	uniforms: Uniform[];
	defines?: Record<string, string>;
	primitive: AbstractMaterialPrimitiveParams;
	depth: AbstractMaterialDepthParams;
	blend: AbstractMaterialBlendParams;
}

export default interface AbstractMaterial {
	readonly name: string;
	readonly vertexShaderSource: string;
	readonly fragmentShaderSource: string;
	readonly uniforms: Uniform[];
	readonly defines: Record<string, string>;
	readonly primitive: AbstractMaterialPrimitiveParams;
	readonly depth: AbstractMaterialDepthParams;
	readonly blend: AbstractMaterialBlendParams;
	getUniform<T extends Uniform>(name: string, block?: string): T;
	updateUniform(name: string): void;
	updateUniformBlock(name: string): void;
	recompile(): void;
}