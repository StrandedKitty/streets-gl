import Mesh from "./Mesh";
import Renderer from "./Renderer";
import GLConstants from "./GLConstants";

export default class MeshInstanced extends Mesh {
	public instances: number;

	public constructor(renderer: Renderer, {
		vertices,
		indices = null,
		instances
	}: {
		vertices: TypedArray;
		indices?: TypedArray;
		instances: number;
	}) {
		super(renderer, {vertices, indices});

		this.instances = instances;
	}

	public draw(): void {
		const material = this.renderer.currentMaterial;

		this.bindVAO(material);

		if (this.indexed) {
			this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

			this.gl.drawElementsInstanced(material.drawMode, this.indices.length, GLConstants.UNSIGNED_INT, 0, this.instances);

			this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, null);
		} else {
			this.gl.drawArraysInstanced(material.drawMode, 0, this.vertices.length / 3, this.instances);
		}
	}
}
