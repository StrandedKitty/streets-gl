import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import AbstractTextureCube from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import AbstractTexture3D from "~/lib/renderer/abstract-renderer/AbstractTexture3D";

interface BaseUniform {
	name: string;
	block: string | null;
}

export interface UniformTexture2D extends BaseUniform {
	type: RendererTypes.UniformType.Texture2D;
	value: AbstractTexture2D;
}

export interface UniformTextureCube extends BaseUniform {
	type: RendererTypes.UniformType.TextureCube;
	value: AbstractTextureCube;
}

export interface UniformTexture2DArray extends BaseUniform {
	type: RendererTypes.UniformType.Texture2DArray;
	value: AbstractTexture2DArray;
}

export interface UniformTexture3D extends BaseUniform {
	type: RendererTypes.UniformType.Texture3D;
	value: AbstractTexture3D;
}

export interface UniformMatrix3 extends BaseUniform {
	type: RendererTypes.UniformType.Matrix3;
	value: Float32Array;
}

export interface UniformMatrix4 extends BaseUniform {
	type: RendererTypes.UniformType.Matrix4;
	value: Float32Array;
}

export interface UniformInt1 extends BaseUniform {
	type: RendererTypes.UniformType.Int1;
	value: Int32Array;
}

export interface UniformInt2 extends BaseUniform {
	type: RendererTypes.UniformType.Int2;
	value: Int32Array;
}

export interface UniformInt3 extends BaseUniform {
	type: RendererTypes.UniformType.Int3;
	value: Int32Array;
}

export interface UniformInt4 extends BaseUniform {
	type: RendererTypes.UniformType.Int4;
	value: Int32Array;
}

export interface UniformUint1 extends BaseUniform {
	type: RendererTypes.UniformType.Uint1;
	value: Uint32Array;
}

export interface UniformUint2 extends BaseUniform {
	type: RendererTypes.UniformType.Uint2;
	value: Uint32Array;
}

export interface UniformUint3 extends BaseUniform {
	type: RendererTypes.UniformType.Uint3;
	value: Uint32Array;
}

export interface UniformUint4 extends BaseUniform {
	type: RendererTypes.UniformType.Uint4;
	value: Uint32Array;
}

export interface UniformFloat1 extends BaseUniform {
	type: RendererTypes.UniformType.Float1;
	value: Float32Array;
}

export interface UniformFloat2 extends BaseUniform {
	type: RendererTypes.UniformType.Float2;
	value: Float32Array;
}

export interface UniformFloat3 extends BaseUniform {
	type: RendererTypes.UniformType.Float3;
	value: Float32Array;
}

export interface UniformFloat4 extends BaseUniform {
	type: RendererTypes.UniformType.Float4;
	value: Float32Array;
}

export type Uniform =
	| UniformTexture2D
	| UniformTextureCube
	| UniformTexture2DArray
	| UniformTexture3D
	| UniformMatrix3
	| UniformMatrix4
	| UniformInt1
	| UniformInt2
	| UniformInt3
	| UniformInt4
	| UniformUint1
	| UniformUint2
	| UniformUint3
	| UniformUint4
	| UniformFloat1
	| UniformFloat2
	| UniformFloat3
	| UniformFloat4;