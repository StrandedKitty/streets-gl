import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import Way3D from "./Way3D";
import Vec3 from "../../../../../math/Vec3";
import Vec2 from "../../../../../math/Vec2";
import MathUtils from "../../../../../math/MathUtils";
import Config from "../../../../Config";
import * as Simplify from "simplify-js";

export enum RingType {
	Outer,
	Inner
}

export default class Ring3D extends Feature3D {
	public nodes: Node3D[];
	public vertices: [number, number][];
	private parent: Way3D;
	public type: RingType;
	public minGroundHeight: number;
	public maxGroundHeight: number;
	public closed: boolean;
	private gaussArea: number;
	public isMergeable = false;
	public deleted = false;

	public constructor(id: number, type: RingType, nodes: Node3D[], parent: Way3D, tags: Tags) {
		super(id, tags);

		this.type = type;
		this.nodes = nodes;
		this.parent = parent;

		/*this.vertices = [];

		this.buildVerticesFromNodes();

		this.closed = this.isClosed();

		this.updateGaussArea();
		this.fixDirection();*/
	}

	public build(): void {
		this.vertices = [];

		this.buildVerticesFromNodes();

		this.closed = this.isClosed();

		this.updateGaussArea();
		this.fixDirection();
	}

	public tryMerge(ring: Ring3D): boolean {
		if (this.type !== ring.type || this.id === ring.id || !this.isMergeable || !ring.isMergeable) {
			return false;
		}

		const removeLastEl = (arr: Node3D[]): Node3D[] => {
			return arr.slice(0, arr.length - 1);
		};

		if (this.firstNode.posEquals(ring.firstNode)) {
			this.nodes = [...removeLastEl(this.nodes.reverse()), ...ring.nodes];
			return true;
		} else if (this.lastNode.posEquals(ring.firstNode)) {
			this.nodes = [...removeLastEl(this.nodes), ...ring.nodes];
			return true;
		} else if (this.firstNode.posEquals(ring.lastNode)) {
			this.nodes = [...ring.nodes, ...this.nodes.slice(1)];
			return true;
		} else if (this.lastNode.posEquals(ring.lastNode)) {
			this.nodes = [...ring.nodes, ...this.nodes.reverse().slice(1)];
			return true;
		}

		return false;
	}

	public get firstNode(): Node3D {
		return this.nodes[0];
	}

	public get lastNode(): Node3D {
		return this.nodes[this.nodes.length - 1];
	}

	private buildVerticesFromNodes(): void {
		const nodeVertices: Vec2[] = this.nodes.map(node => Vec2.copy(node.position));

		if (nodeVertices.length <= 3) {
			this.vertices = nodeVertices.map(p => [p.x, p.y]);
			return;
		}

		this.vertices = Simplify(nodeVertices, 0.5, false).map(p => [p.x, p.y]);
	}

	public updateFootprintHeight(): void {
		let maxHeight = -Infinity;
		let minHeight = Infinity;

		for (const node of this.nodes) {
			const tileX = Math.floor(node.tile.x);
			const tileY = Math.floor(node.tile.y);

			minHeight = Math.min(minHeight, this.parent.heightViewer.getHeight(tileX, tileY, node.tile.x % 1, node.tile.y % 1));
			maxHeight = Math.max(maxHeight, this.parent.heightViewer.getHeight(tileX, tileY, node.tile.x % 1, node.tile.y % 1));
		}

		if (minHeight === Infinity) {
			minHeight = 100;
		}

		if (maxHeight === -Infinity) {
			maxHeight = 100;
		}

		this.minGroundHeight = minHeight;
		this.maxGroundHeight = maxHeight;
	}

	private updateGaussArea(): void {
		let sum = 0;

		for (let i = 0; i < this.vertices.length; i++) {
			const point1 = this.vertices[i];
			const point2 = this.vertices[i + 1] || this.vertices[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		this.gaussArea = sum;
	}

	public getArea(): number {
		return Math.abs(this.gaussArea);
	}

	private isClockwise(): boolean {
		return this.gaussArea > 0;
	}

	private isClosed(): boolean {
		return this.nodes[0].id === this.nodes[this.nodes.length - 1].id;
	}

	private fixDirection(): void {
		if (+!this.isClockwise() ^ +(this.type === RingType.Inner)) {
			this.nodes.reverse();
			this.vertices.reverse();
			this.gaussArea *= -1;
		}
	}

	public getFlattenVertices(): number[] {
		return this.vertices.flat();
	}

	private getLength(): number {
		let length = 0;

		for (let i = 0; i < this.vertices.length - 1; i++) {
			const point1 = this.vertices[i];
			const point2 = this.vertices[i + 1];
			length += Math.sqrt((point2[0] - point1[0]) ** 2 + (point2[1] - point1[1]) ** 2);
		}

		return length;
	}

	public triangulateWalls(): { positions: Float32Array; uvs: Float32Array; normals: Float32Array; textureIds: Uint8Array } {
		const tags = this.parent.tags;
		const heightFactor = this.parent.heightFactor;

		const height = (+tags.height || 6) * heightFactor + this.parent.minGroundHeight;
		const minHeight = (+tags.minHeight || 0) * heightFactor + this.parent.minGroundHeight;

		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];

		const segmentNormals: Vec3[] = [];
		const edgeSmoothness: boolean[] = [];

		const uvMinY = 0;
		const uvMaxY = height - minHeight;
		let uvX = 0;

		for (let i = 0; i < this.vertices.length - 1; i++) {
			const prevVertexId = i < 1 ? this.vertices.length - 2 : i - 1;

			const vertex = new Vec2(this.vertices[i][0], this.vertices[i][1]);
			const nextVertex = new Vec2(this.vertices[i + 1][0], this.vertices[i + 1][1]);
			const prevVertex = new Vec2(this.vertices[prevVertexId][0], this.vertices[prevVertexId][1]);

			const segmentLength = Vec2.distance(vertex, nextVertex);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(vertex.x, height, vertex.y);
			positions.push(vertex.x, minHeight, vertex.y);

			positions.push(nextVertex.x, minHeight, nextVertex.y);
			positions.push(nextVertex.x, height, nextVertex.y);
			positions.push(vertex.x, height, vertex.y);

			const normal = MathUtils.calculateNormal(
				new Vec3(nextVertex.x, minHeight, nextVertex.y),
				new Vec3(vertex.x, height, vertex.y),
				new Vec3(vertex.x, minHeight, vertex.y)
			);

			segmentNormals.push(Vec3.multiplyScalar(normal, segmentLength));

			const segmentVector = Vec2.normalize(Vec2.sub(nextVertex, vertex));
			const prevSegmentVector = Vec2.normalize(Vec2.sub(vertex, prevVertex));
			const dotProduct = Vec2.dot(segmentVector, prevSegmentVector);

			edgeSmoothness.push(dotProduct > Math.cos(MathUtils.toRad(Config.BuildingSmoothNormalsThreshold)));

			const nextUvX = uvX + segmentLength;

			uvs.push(
				nextUvX, uvMinY,
				uvX, uvMaxY,
				uvX, uvMinY
			);
			uvs.push(
				nextUvX, uvMinY,
				nextUvX, uvMaxY,
				uvX, uvMaxY
			);

			uvX = nextUvX;
		}

		for (let i = 0; i < segmentNormals.length; i++) {
			const normal = segmentNormals[i];
			const normalNormalized = Vec3.normalize(segmentNormals[i]);
			const nextNormal = i === segmentNormals.length - 1 ? segmentNormals[0] : segmentNormals[i + 1];
			const prevNormal = i === 0 ? segmentNormals[segmentNormals.length - 1] : segmentNormals[i - 1];

			const isSmooth: [boolean, boolean] = [
				edgeSmoothness[i],
				i === edgeSmoothness.length - 1 ? edgeSmoothness[0] : edgeSmoothness[i + 1]
			];

			const vertexSides: number[] = [1, 0, 0, 1, 1, 0];

			for (let j = 0; j < 6; j++) {
				const side = vertexSides[j];

				if (isSmooth[side]) {
					const neighborNormal = side === 1 ? nextNormal : prevNormal;
					normals.push(...Vec3.toArray(Vec3.normalize(Vec3.add(normal, neighborNormal))));
				} else {
					normals.push(normalNormalized.x, normalNormalized.y, normalNormalized.z);
				}
			}
		}

		return {
			positions: new Float32Array(positions),
			uvs: new Float32Array(uvs),
			normals: new Float32Array(normals),
			textureIds: new Uint8Array()
		};
	}
}