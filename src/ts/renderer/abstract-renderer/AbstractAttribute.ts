import {RendererTypes} from "~/renderer/RendererTypes";

export interface AbstractAttributeParams {
	name: string;
	size: number;
	type: RendererTypes.AttributeType;
	format: RendererTypes.AttributeFormat;
	usage?: RendererTypes.BufferUsage;
	normalized: boolean;
	instanced?: boolean;
	divisor?: number;
	data?: TypedArray;
}

export default interface AbstractAttribute {
	name: string;
	size: number;
	type: RendererTypes.AttributeType;
	format: RendererTypes.AttributeFormat;
	usage: RendererTypes.BufferUsage;
	normalized: boolean;
	instanced: boolean;
	divisor: number;
	data: TypedArray;
	setData(data: TypedArray): void;
}