import AbstractMesh, {AbstractMeshParams} from "~/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderPass from "~/renderer/abstract-renderer/AbstractRenderPass";
import WebGL2Renderer from "~/renderer/webgl2-renderer/WebGL2Renderer";
import WebGL2Material from "~/renderer/webgl2-renderer/WebGL2Material";
import WebGL2Constants from "~/renderer/webgl2-renderer/WebGL2Constants";
import WebGL2Attribute from "~/renderer/webgl2-renderer/WebGL2Attribute";
import WebGL2VAO from "~/renderer/webgl2-renderer/WebGL2VAO";

export default class WebGL2Mesh implements AbstractMesh {
	private readonly renderer: WebGL2Renderer;
	private readonly gl: WebGL2RenderingContext;
	public indexed: boolean;
	private attributes: Map<string, WebGL2Attribute> = new Map();
	private materialsAttributes: Map<string, Map<string, WebGL2Attribute>> = new Map();
	private vaos: Map<string, WebGL2VAO> = new Map();

	constructor(
		renderer: WebGL2Renderer, {
			indexed = false,
			attributes = []
		}: AbstractMeshParams
	) {
		this.renderer = renderer;
		this.gl = renderer.gl;
		this.indexed = indexed;

		for (const attribute of attributes) {
			this.addAttribute(<WebGL2Attribute>attribute);
		}
	}

	private bindVAO(material: WebGL2Material) {
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

	public draw() {
		this.bindVAO(this.renderer.boundMaterial);

		this.gl.drawArrays(WebGL2Constants.TRIANGLES, 0, this.attributes.get('position').data.length / 3);
	}

	public getAttribute(name: string): WebGL2Attribute {
		return this.attributes.get(name);
	}

	public addAttribute(attribute: WebGL2Attribute) {
		this.attributes.set(attribute.name, attribute);
	}

	public delete() {
		for (const vao of this.vaos.values()) {
			vao.delete();
		}
	}
}