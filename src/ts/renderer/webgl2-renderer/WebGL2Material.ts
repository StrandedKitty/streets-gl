import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractMaterial, {
	AbstractMaterialBlendParams,
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
	public readonly defines: Record<string, string>;
	public readonly primitive: AbstractMaterialPrimitiveParams;
	public readonly depth: AbstractMaterialDepthParams;
	public readonly blend: AbstractMaterialBlendParams;
	public program: WebGL2Program;
	private ubos: Map<string, WebGL2UBO> = new Map();
	private uniformLocations: Map<string, WebGLUniformLocation> = new Map();
	private uniformTextureUnits: Map<string, number> = new Map();

	public constructor(
		renderer: WebGL2Renderer,
		{
			name,
			vertexShaderSource,
			fragmentShaderSource,
			uniforms,
			defines = {},
			primitive,
			depth,
			blend
		}: AbstractMaterialParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.name = name;
		this.vertexShaderSource = vertexShaderSource;
		this.fragmentShaderSource = fragmentShaderSource;
		this.uniforms = uniforms;
		this.defines = defines;
		this.primitive = primitive;
		this.depth = depth;
		this.blend = blend;

		this.createProgram();
		this.createUBOs();
	}

	private createProgram(): void {
		this.program = new WebGL2Program({
			name: this.name,
			renderer: this.renderer,
			vertexShaderSource: this.vertexShaderSource,
			fragmentShaderSource: this.fragmentShaderSource,
			defines: this.defines
		});
	}

	public recompile(): void {
		this.program.recompileShaders();
		this.uniformLocations.clear();
	}

	private createUBOs(): void {
		const blocksCount = this.gl.getProgramParameter(this.program.WebGLProgram, WebGL2Constants.ACTIVE_UNIFORM_BLOCKS);

		for (let i = 0; i < blocksCount; i++) {
			const ubo = new WebGL2UBO(this.renderer, this.program, i);

			ubo.bindToBindingPoint(i);
			this.ubos.set(ubo.blockName, ubo);
		}

		for (const uniform of this.uniforms) {
			if (uniform.block !== null) {
				const ubo = this.ubos.get(uniform.block);

				if (!ubo) {
					throw new Error();
				}

				ubo.setUniformValue(uniform.name, uniform.value as TypedArray);
			}
		}

		for (const ubo of this.ubos.values()) {
			ubo.applyUpdates();
		}
	}

	public getUniform<T extends Uniform>(name: string, block: string = null): T {
		return this.uniforms.find(u => u.name === name && u.block === block) as T;
	}

	private getUniformsInBlock(block: string): Uniform[] {
		return this.uniforms.filter(u => u.block === block);
	}

	public use(): void {
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

	public updateUniform(name: string): void {
		this.renderer.useMaterial(this);

		const uniform = this.getUniform(name);

		this.setUniformValueAtLocation(uniform);
	}

	public updateUniformBlock(blockName: string): void {
		this.renderer.useMaterial(this);

		const ubo = this.ubos.get(blockName);

		for (const uniform of this.uniforms) {
			if (uniform.block === blockName) {
				ubo.setUniformValue(uniform.name, uniform.value as TypedArray);
			}
		}

		ubo.applyUpdates();
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

	private setUniformValueAtLocation(uniform: Uniform): void {
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
				this.gl.uniform1uiv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Uint2:
				this.gl.uniform2uiv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Uint3:
				this.gl.uniform3uiv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Uint4:
				this.gl.uniform4uiv(location, uniform.value);
				break;
			case RendererTypes.UniformType.Matrix3:
				this.gl.uniformMatrix3fv(location, false, uniform.value);
				break;
			case RendererTypes.UniformType.Matrix4:
				this.gl.uniformMatrix4fv(location, false, uniform.value);
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