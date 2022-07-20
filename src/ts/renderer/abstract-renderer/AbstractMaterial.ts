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

export interface AbstractMaterialParams {
	name: string;
	vertexShaderSource: string;
	fragmentShaderSource: string;
	uniforms: Uniform[];
	primitive: AbstractMaterialPrimitiveParams;
	depth: AbstractMaterialDepthParams;
}

export default interface AbstractMaterial {
	readonly name: string;
	readonly vertexShaderSource: string;
	readonly fragmentShaderSource: string;
	readonly uniforms: Uniform[];
	readonly primitive: AbstractMaterialPrimitiveParams;
	readonly depth: AbstractMaterialDepthParams;
	getUniform<T extends Uniform>(name: string, block?: string): T;
	uniformNeedsUpdate(name: string, block?: string): void;
	applyUniformUpdates(name: string, block?: string): void;
	applyAllUniformsUpdates(): void;
}