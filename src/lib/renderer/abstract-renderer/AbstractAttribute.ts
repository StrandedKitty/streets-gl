import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractAttributeBuffer from "~/lib/renderer/abstract-renderer/AbstractAttributeBuffer";

export interface AbstractAttributeParams {
	name: string;
	size: number;
	type: RendererTypes.AttributeType;
	format: RendererTypes.AttributeFormat;
	normalized: boolean;
	instanced?: boolean;
	divisor?: number;
	stride?: number;
	offset?: number;
	buffer: AbstractAttributeBuffer;
}

export default interface AbstractAttribute {
	name: string;
	size: number;
	type: RendererTypes.AttributeType;
	format: RendererTypes.AttributeFormat;
	normalized: boolean;
	instanced: boolean;
	divisor: number;
	stride: number;
	offset: number;
	buffer: AbstractAttributeBuffer;
}