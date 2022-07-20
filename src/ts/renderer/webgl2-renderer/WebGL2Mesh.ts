import AbstractMesh, {AbstractMeshParams} from "~/renderer/abstract-renderer/AbstractMesh";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Material from "~/renderer/webgl2-renderer/WebGL2Material";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Attribute from "~/renderer/webgl2-renderer/WebGL2Attribute";
import WebGL2VAO from "~/renderer/webgl2-renderer/WebGL2VAO";

export default class WebGL2Mesh implements AbstractMesh {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	public indexed: boolean;
	public indices: Uint32Array;
	private indexBuffer: WebGLBuffer;
	private attributes: Map<string, WebGL2Attribute> = new Map();
	private materialsAttributes: Map<string, Map<string, WebGL2Attribute>> = new Map();
	private vaos: Map<string, WebGL2VAO> = new Map();

	public constructor(
		renderer: WebGL2Renderer, {
			indexed = false,
			indices,
			attributes = []
		}: AbstractMeshParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.indexed = indexed;
		this.indices = indices;

		if (this.indexed) {
			this.createIndexBuffer();
		}

		for (const attribute of attributes) {
			this.addAttribute(<WebGL2Attribute>attribute);
		}
	}

	private createIndexBuffer(): void {
		this.indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(WebGL2Constants.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

		this.gl.bufferData(
			WebGL2Constants.ELEMENT_ARRAY_BUFFER,
			this.indices,
			WebGL2Constants.STATIC_DRAW
		);

		this.gl.bindBuffer(WebGL2Constants.ELEMENT_ARRAY_BUFFER, null);
	}

	public setIndices(indices: Uint32Array): void {
		this.indices = indices;

		this.createIndexBuffer();
	}

	private bindVAO(material: WebGL2Material): void {
		let vao = this.vaos.get(material.name);

		if (!vao) {
			vao = new WebGL2VAO(this.renderer);
			this.vaos.set(material.name, vao);

			this.materialsAttributes.set(material.name, new Map());

			vao.bind();

			for (const attribute of this.attributes.values()) {
				attribute.locate(material.program);

				this.materialsAttributes.get(material.name).set(attribute.name, attribute);
			}
		} else {
			vao.bind();
		}
	}

	public draw(): void {
		this.bindVAO(this.renderer.boundMaterial);

		if (this.indexed) {
			this.gl.bindBuffer(WebGL2Constants.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			this.gl.drawElements(WebGL2Constants.TRIANGLES, this.indices.length, WebGL2Constants.UNSIGNED_INT, 0);
			this.gl.bindBuffer(WebGL2Constants.ELEMENT_ARRAY_BUFFER, null);
		} else {
			this.gl.drawArrays(WebGL2Constants.TRIANGLES, 0, this.attributes.get('position').data.length / 3);
		}
	}

	public getAttribute(name: string): WebGL2Attribute {
		return this.attributes.get(name);
	}

	public addAttribute(attribute: WebGL2Attribute): void {
		this.attributes.set(attribute.name, attribute);
	}

	public delete(): void {
		for (const vao of this.vaos.values()) {
			vao.delete();
		}
	}
}