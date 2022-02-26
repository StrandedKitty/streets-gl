import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractMaterial, {
	AbstractMaterialDepthParams,
	AbstractMaterialParams,
	AbstractMaterialPrimitiveParams,
} from "~/renderer/abstract-renderer/AbstractMaterial";
import {RendererTypes} from "~/renderer/RendererTypes";
import WebGL2Program from "~/renderer/webgl2-renderer/WebGL2Program";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2UBO from "~/renderer/webgl2-renderer/WebGL2UBO";
import {Uniform} from "~/renderer/abstract-renderer/Uniform";
import WebGL2Texture2D from "~/renderer/webgl2-renderer/WebGL2Texture2D";
import WebGL2TextureCube from "~/renderer/webgl2-renderer/WebGL2TextureCube";
import WebGL2Texture2DArray from "~/renderer/webgl2-renderer/WebGL2Texture2DArray";
import WebGL2Texture3D from "~/renderer/webgl2-renderer/WebGL2Texture3D";

export default class WebGL2Material implements AbstractMaterial {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	public readonly name: string;
	public readonly vertexShaderSource: string;
	public readonly fragmentShaderSource: string;
	public readonly uniforms: Uniform[];
	public readonly primitive: AbstractMaterialPrimitiveParams;
	public readonly depth: AbstractMaterialDepthParams;
	public program: WebGL2Program;
	private ubos: Map<string, WebGL2UBO> = new Map();
	private uniformLocations: Map<string, WebGLUniformLocation> = new Map();
	private uniformTextureUnits: Map<string, number> = new Map();
	private uniformsToUpdate: Set<Uniform> = new Set();

	constructor(
		renderer: WebGL2Renderer,
		{
			name,
			vertexShaderSource,
			fragmentShaderSource,
			uniforms,
			primitive,
			depth
		}: AbstractMaterialParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.name = name;
		this.vertexShaderSource = vertexShaderSource;
		this.fragmentShaderSource = fragmentShaderSource;
		this.uniforms = uniforms;
		this.primitive = primitive;
		this.depth = depth;

		this.createProgram();
		this.createUBOs();
	}

	private createProgram() {
		this.program = new WebGL2Program(this.renderer, this.vertexShaderSource, this.fragmentShaderSource);
	}

	private createUBOs() {
		let i = 0;

		for (const blockName of this.getUsedUniformBlocks()) {
			const blockUniforms = this.getUniformsInBlock(blockName);

			if (blockUniforms.length === 0) {
				continue;
			}

			const ubo = new WebGL2UBO(this.renderer, this.program, blockName, blockUniforms);

			ubo.bindToBindingPoint(i);
			this.ubos.set(blockName, ubo);

			++i;
		}
	}

	private getUsedUniformBlocks(): Set<string> {
		const uniformBlocks = new Set<string>();

		for (const uniform of this.uniforms) {
			if (uniform.block !== null) {
				uniformBlocks.add(uniform.block);
			}
		}

		return uniformBlocks;
	}

	public getUniform<T extends Uniform>(name: string, block: string = null): T {
		return this.uniforms.find(u => u.name === name && u.block === block) as T;
	}

	private getUniformsInBlock(block: string): Uniform[] {
		return this.uniforms.filter(u => u.block === block);
	}

	public use() {
		this.gl.useProgram(this.program.WebGLProgram);

		const basicUniforms = this.getUniformsInBlock(null);

		for (const uniform of basicUniforms) {
			this.setUniformValueAtLocation(uniform);
		}

		let i = 0;

		for (const ubo of this.ubos.values()) {
			ubo.bindToBindingPoint(i++);
		}
	}

	public uniformNeedsUpdate(uniformName: string, block: string = null) {
		const uniform = this.getUniform(uniformName, block);

		if (uniform) {
			this.uniformsToUpdate.add(uniform);
		}
	}

	public applyAllUniformsUpdates() {
		for (const uniform of this.uniformsToUpdate) {
			this.applyUniformUpdates(uniform.name, uniform.block);
		}
	}

	public applyUniformUpdates(uniformName: string, block: string = null) {
		this.renderer.useMaterial(this);

		const uniform = this.getUniform(uniformName, block);

		if (block === null) {
			this.applyBasicUniformChanges(uniformName);
		} else {
			this.applyUBOUniformChanges(block, uniformName);
		}

		this.uniformsToUpdate.delete(uniform);
	}

	private applyUBOUniformChanges(block: string, uniformName: string) {
		const ubo = this.ubos.get(block);

		if (!ubo) {
			return;
		}

		ubo.setUniformValue(uniformName, <TypedArray>this.getUniform(uniformName, block).value);
	}

	private applyBasicUniformChanges(uniformName: string) {
		const uniform = this.getUniform(uniformName);

		this.setUniformValueAtLocation(uniform);
	}

	private getUniformLocation(uniform: Uniform): WebGLUniformLocation {
		let location = this.uniformLocations.get(uniform.name);

		if (location === undefined) {
			location = this.gl.getUniformLocation(this.program.WebGLProgram, uniform.name);

			this.uniformLocations.set(uniform.name, location);
		}

		return location;
	}

	private getUniformTextureUnit(uniform: Uniform): number {
		let textureUnit = this.uniformTextureUnits.get(uniform.name);

		if (textureUnit === undefined) {
			const reservedUnitsArray = Array.from(this.uniformTextureUnits.values());
			const maxUnit = reservedUnitsArray.length === 0 ? -1 : Math.max(...reservedUnitsArray);

			textureUnit = maxUnit + 1;

			this.uniformTextureUnits.set(uniform.name, textureUnit);
		}

		return textureUnit;
	}

	private setUniformValueAtLocation(uniform: Uniform) {
		const location = this.getUniformLocation(uniform);

		if (location === null) {
			return;
		}

		switch (uniform.type) {
			case RendererTypes.UniformType.Float1:
				this.gl.uniform1fv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Float2:
				this.gl.uniform2fv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Float3:
				this.gl.uniform3fv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Float4:
				this.gl.uniform3fv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Int1:
				this.gl.uniform1iv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Int2:
				this.gl.uniform2iv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Int3:
				this.gl.uniform3iv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Int4:
				this.gl.uniform4iv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Uint1:
				this.gl.uniform1uiv(location, uniform.value as Uint32Array);
				break;
			case RendererTypes.UniformType.Uint2:
				this.gl.uniform2uiv(location, uniform.value as Uint32Array);
				break;
			case RendererTypes.UniformType.Uint3:
				this.gl.uniform3uiv(location, uniform.value as Uint32Array);
				break;
			case RendererTypes.UniformType.Uint4:
				this.gl.uniform4uiv(location, uniform.value as Uint32Array);
				break;
			case RendererTypes.UniformType.Matrix3:
				this.gl.uniformMatrix3fv(location, false, uniform.value as Float32Array);
				break;
			case RendererTypes.UniformType.Matrix4:
				this.gl.uniformMatrix4fv(location, false, uniform.value as Float32Array);
				break;
			case RendererTypes.UniformType.Texture2D: {
				const textureUnit = this.getUniformTextureUnit(uniform);
				this.gl.activeTexture(WebGL2Constants.TEXTURE0 + textureUnit);
				this.gl.bindTexture(WebGL2Constants.TEXTURE_2D, (uniform.value as WebGL2Texture2D)?.WebGLTexture);
				this.gl.uniform1i(location, textureUnit);
				break;
			}
			case RendererTypes.UniformType.TextureCube: {
				const textureUnit = this.getUniformTextureUnit(uniform);
				this.gl.activeTexture(WebGL2Constants.TEXTURE0 + textureUnit);
				this.gl.bindTexture(WebGL2Constants.TEXTURE_CUBE_MAP, (uniform.value as WebGL2TextureCube)?.WebGLTexture);
				this.gl.uniform1i(location, textureUnit);
				break;
			}
			case RendererTypes.UniformType.Texture2DArray: {
				const textureUnit = this.getUniformTextureUnit(uniform);
				this.gl.activeTexture(WebGL2Constants.TEXTURE0 + textureUnit);
				this.gl.bindTexture(WebGL2Constants.TEXTURE_2D_ARRAY, (uniform.value as WebGL2Texture2DArray)?.WebGLTexture);
				this.gl.uniform1i(location, textureUnit);
				break;
			}
			case RendererTypes.UniformType.Texture3D: {
				const textureUnit = this.getUniformTextureUnit(uniform);
				this.gl.activeTexture(WebGL2Constants.TEXTURE0 + textureUnit);
				this.gl.bindTexture(WebGL2Constants.TEXTURE_3D, (uniform.value as WebGL2Texture3D)?.WebGLTexture);
				this.gl.uniform1i(location, textureUnit);
				break;
			}
		}
	}
}