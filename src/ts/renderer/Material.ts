import Program from "./Program";
import Renderer from "./Renderer";
import GLConstants from "./GLConstants";

enum UniformType {
	Texture2D,
	TextureCube,
	Texture3D,
	Texture2DArray,
	Matrix4,
	Matrix3,
	Int1,
	Int1Array,
	Int2,
	Int3,
	Int4,
	Uint1,
	Uint2,
	Uint3,
	Uint4,
	Float1,
	Float1Array,
	Float2,
	Float3,
	Float4
}

interface Uniform {
	type: UniformType;
	value: any
}

let materialID = 0;

export default class Material {
	private readonly gl: WebGL2RenderingContext;
	private readonly renderer: Renderer;
	public readonly uniforms: { [key: string]: Uniform };
	public readonly uniformsLocations: { [key: string]: WebGLUniformLocation };
	public readonly defines: { [key: string]: number };
	public readonly name: string;
	public readonly drawMode: number;
	public readonly program: Program;
	private readonly textureUnits: Map<WebGLUniformLocation, number> = new Map();

	constructor(renderer: Renderer, {
		vertexShader,
		fragmentShader,
		uniforms = {},
		defines = {},
		name = "Material" + ++materialID,
		drawMode = GLConstants.TRIANGLES
	}: {
		vertexShader: string,
		fragmentShader: string,
		uniforms?: { [key: string]: Uniform },
		defines?: { [key: string]: number },
		name?: string,
		drawMode?: number
	}) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.uniforms = uniforms;
		this.uniformsLocations = {};
		this.defines = defines;
		this.name = name;
		this.drawMode = drawMode;
		this.program = new Program(renderer, {
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});
	}

	public use() {
		this.gl.useProgram(this.program.WebGLProgram);

		let texturesUsed = 0;

		for (const [name, uniform] of Object.entries(this.uniforms)) {
			let location = this.uniformsLocations[name];

			if (location === undefined) {
				location = this.gl.getUniformLocation(this.program.WebGLProgram, name);

				this.uniformsLocations[name] = location;

				if (location === null) {
					//throw new Error(`Location for uniform ${name} is null for material ${this.name}`);
				}
			}

			if (location !== null) {
				if (uniform.type === UniformType.Texture2D) {
					if(uniform.value !== null) {
						this.gl.activeTexture(GLConstants.TEXTURE0 + texturesUsed);
						this.gl.bindTexture(GLConstants.TEXTURE_2D, uniform.value?.WebGLTexture);
						this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					}

					this.textureUnits.set(this.uniformsLocations[name], GLConstants.TEXTURE0 + texturesUsed);

					++texturesUsed;
				} else if (uniform.type === UniformType.TextureCube) {
					if(uniform.value !== null) {
						this.gl.activeTexture(GLConstants.TEXTURE0 + texturesUsed);
						if (uniform.value.loaded) {
							this.gl.bindTexture(GLConstants.TEXTURE_CUBE_MAP, uniform.value?.WebGLTexture);
						}
						this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					}

					this.textureUnits.set(this.uniformsLocations[name], GLConstants.TEXTURE0 + texturesUsed);

					++texturesUsed;
				} else if (uniform.type === UniformType.Texture2DArray) {
					if(uniform.value !== null) {
						this.gl.activeTexture(GLConstants.TEXTURE0 + texturesUsed);
						this.gl.bindTexture(GLConstants.TEXTURE_2D_ARRAY, uniform.value?.WebGLTexture);
						this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					}

					this.textureUnits.set(this.uniformsLocations[name], GLConstants.TEXTURE0 + texturesUsed);

					++texturesUsed;
				} else if (uniform.type === UniformType.Texture3D) {
					if(uniform.value !== null) {
						this.gl.activeTexture(GLConstants.TEXTURE0 + texturesUsed);
						this.gl.bindTexture(GLConstants.TEXTURE_3D, uniform.value?.WebGLTexture);
						this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					}

					this.textureUnits.set(this.uniformsLocations[name], GLConstants.TEXTURE0 + texturesUsed);

					++texturesUsed;
				} else {
					if (uniform.value !== null) {
						this.updateUniform(name);
					}
				}
			}
		}

		this.renderer.currentMaterial = this;
	}

	public updateUniform(name: string) {
		const uniform = this.uniforms[name];
		const location = this.uniformsLocations[name];
		const textureUnit = this.textureUnits.get(location);

		switch (uniform.type) {
			case UniformType.Float1:
				this.gl.uniform1f(location, uniform.value);
				break;
			case UniformType.Float1Array:
				this.gl.uniform1fv(location, uniform.value);
				break;
			case UniformType.Float2:
				this.gl.uniform2fv(location, uniform.value);
				break;
			case UniformType.Float3:
				this.gl.uniform3fv(location, uniform.value);
				break;
			case UniformType.Float4:
				this.gl.uniform3fv(location, uniform.value);
				break;
			case UniformType.Int1:
				this.gl.uniform1i(location, uniform.value);
				break;
			case UniformType.Int1Array:
				this.gl.uniform1iv(location, uniform.value);
				break;
			case UniformType.Int2:
				this.gl.uniform2iv(location, uniform.value);
				break;
			case UniformType.Int3:
				this.gl.uniform3iv(location, uniform.value);
				break;
			case UniformType.Int4:
				this.gl.uniform4iv(location, uniform.value);
				break;
			case UniformType.Uint1:
				this.gl.uniform1ui(location, uniform.value);
				break;
			case UniformType.Uint2:
				this.gl.uniform2uiv(location, uniform.value);
				break;
			case UniformType.Uint3:
				this.gl.uniform3uiv(location, uniform.value);
				break;
			case UniformType.Uint4:
				this.gl.uniform4uiv(location, uniform.value);
				break;
			case UniformType.Matrix3:
				this.gl.uniformMatrix3fv(location, false, new Float32Array(uniform.value.values));
				break;
			case UniformType.Matrix4:
				this.gl.uniformMatrix4fv(location, false, new Float32Array(uniform.value.values));
				break;
			case UniformType.Texture2D:
				if (textureUnit) {
					this.gl.activeTexture(textureUnit);
					this.gl.bindTexture(GLConstants.TEXTURE_2D, uniform.value.WebGLTexture);
				}

				break;
			case UniformType.Texture2DArray:
				if (textureUnit) {
					this.gl.activeTexture(textureUnit);
					this.gl.bindTexture(GLConstants.TEXTURE_2D_ARRAY, uniform.value.WebGLTexture);
				}

				break;

		}
	}
}

export {UniformType};
