import Object3D from "../core/Object3D";
import Attribute, {AttributeFormat} from "./Attribute";
import VAO from "./VAO";
import AABB from "../core/AABB";
import Renderer from "./Renderer";
import Vec3 from "../math/Vec3";
import GLConstants from "./GLConstants";
import Camera from "../core/Camera";
import Material from "./Material";

interface MeshAttribute {
	params: {
		name: string,
		size: number,
		type: number,
		normalized: boolean,
		instanced: boolean,
		divisor: number,
		dataFormat: AttributeFormat,
		usage: number
	};
	buffer: TypedArray
}

export default class Mesh extends Object3D {
	protected readonly gl: WebGL2RenderingContext;
	protected readonly renderer: Renderer;

	public attributes: Map<string, MeshAttribute> = new Map();
	private materialsAttributes: Map<string, Map<string, Attribute>> = new Map();
	private vaos: Map<string, VAO> = new Map();
	public bbox: AABB;
	public vertices: TypedArray;
	public indices: TypedArray;
	public indexed: boolean;
	protected indexBuffer: WebGLBuffer;

	constructor(renderer: Renderer, {
		vertices,
		indices = null
	}: {
		vertices?: TypedArray,
		indices?: TypedArray
	} = {}) {
		super();

		this.renderer = renderer;
		this.gl = renderer.gl;

		this.vertices = vertices;
		this.indices = indices;
		this.indexed = this.indices !== null;

		if (this.indexed) {
			this.updateIndexBuffer();
		}

		if (vertices) {
			this.addAttribute({name: 'position'});
			this.setAttributeData('position', this.vertices);
		}
	}

	public draw() {
		const material = this.renderer.currentMaterial;

		this.bindVAO(material);

		if (this.indexed) {
			this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

			this.gl.drawElements(material.drawMode, this.indices.length, GLConstants.UNSIGNED_INT, 0);

			this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, null);
		} else {
			this.gl.drawArrays(material.drawMode, 0, this.vertices.length / 3);
		}
	}

	protected bindVAO(material: Material) {
		let vao = this.vaos.get(material.name);

		if (!vao) {
			vao = new VAO(this.renderer);
			this.vaos.set(material.name, vao);

			this.materialsAttributes.set(material.name, new Map());

			vao.bind();

			for (const [attributeName, {params, buffer}] of this.attributes.entries()) {
				const attribute = new Attribute(this.renderer, params);

				attribute.setData(buffer);
				attribute.locate(material.program);

				this.materialsAttributes.get(material.name).set(attributeName, attribute);
			}
		} else {
			vao.bind();
		}
	}

	private createIndexBuffer() {
		this.indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

		this.gl.bufferData(
			GLConstants.ELEMENT_ARRAY_BUFFER,
			this.indices,
			GLConstants.STATIC_DRAW
		);

		this.gl.bindBuffer(GLConstants.ELEMENT_ARRAY_BUFFER, null);
	}

	public updateIndexBuffer() {
		this.createIndexBuffer();
	}

	public addAttribute(
		{
			name,
			size = 3,
			type = GLConstants.FLOAT,
			normalized = false,
			instanced = false,
			divisor = 1,
			dataFormat = AttributeFormat.Float,
			usage = GLConstants.DYNAMIC_DRAW
		}: {
			name: string,
			size?: number,
			type?: number,
			normalized?: boolean,
			instanced?: boolean,
			divisor?: number,
			dataFormat?: AttributeFormat,
			usage?: number
		}) {
		this.attributes.set(name, {
			params: {name, size, type, normalized, instanced, divisor, dataFormat, usage},
			buffer: null
		});
	}

	public setAttributeData(attributeName: string, data: TypedArray) {
		this.attributes.get(attributeName).buffer = data;
	}

	public updateAttribute(attributeName: string) {
		for (const [materialName, attributeList] of this.materialsAttributes.entries()) {
			const attribute = attributeList.get(attributeName);

			this.vaos.get(materialName).bind();
			attribute.setData(this.attributes.get(attributeName).buffer);
		}
	}

	public setBoundingBox(min: Vec3, max: Vec3) {
		this.bbox = new AABB(min, max);
	}

	public inCameraFrustum(camera: Camera): boolean {
		if (this.bbox) {
			const planes = camera.frustumPlanes;

			for (let i = 0; i < 6; ++i) {
				const plane = planes[i];

				const viewSpaceAABB = this.bbox.toSpace(this.matrixWorld);

				const point = new Vec3(
					plane.x > 0 ? viewSpaceAABB.max.x : viewSpaceAABB.min.x,
					plane.y > 0 ? viewSpaceAABB.max.y : viewSpaceAABB.min.y,
					plane.z > 0 ? viewSpaceAABB.max.z : viewSpaceAABB.min.z
				);

				if (plane.distanceToPoint(point) < 0) {
					return false;
				}
			}

			return true;
		} else {
			throw new Error('Mesh has no BBox');
		}
	}

	public delete() {
		this.parent.remove(this);

		for (const [name, vao] of this.vaos.entries()) {
			vao.delete();
			this.vaos.delete(name)
		}

		for (let attributeList of this.materialsAttributes.values()) {
			for (const attributeName of this.attributes.keys()) {
				attributeList.get(attributeName).delete();
				attributeList.delete(attributeName);
			}
		}
	}
}
