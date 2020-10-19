import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import Way3D from "./Way3D";

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

	constructor(id: number, type: RingType, nodes: Node3D[], parent: Way3D, tags: Tags) {
		super(id, tags);

		this.type = type;
		this.nodes = nodes;
		this.parent = parent;

		this.vertices = [];

		for (const node of this.nodes) {
			this.vertices.push([node.position.x, node.position.y]);
		}

		this.closed = this.isClosed();

		this.fixDirection();
	}

	public updateFootprintHeight() {
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

	private isClosed(): boolean {
		return this.nodes[0].id === this.nodes[this.nodes.length - 1].id;
	}

	private isClockwise(): boolean {
		let sum = 0;

		for (let i = 0; i < this.vertices.length; i++) {
			const point1 = this.vertices[i];
			const point2 = this.vertices[i + 1] || this.vertices[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return sum > 0;
	}

	private fixDirection() {
		if (+!this.isClockwise() ^ +(this.type === RingType.Inner)) {
			this.nodes.reverse();
			this.vertices.reverse();
		}
	}

	public getFlattenVertices(): number[] {
		return this.vertices.flat();
	}

	private getLength() {
		let length = 0;

		for (let i = 0; i < this.vertices.length - 1; i++) {
			const point1 = this.vertices[i];
			const point2 = this.vertices[i + 1];
			length += Math.sqrt((point2[0] - point1[0]) ** 2 + (point2[1] - point1[1]) ** 2);
		}

		return length;
	}

	public triangulateWalls(): number[] {
		const tags = this.parent.tags;
		const heightFactor = this.parent.heightFactor;

		const height = (+tags.height || 6) * heightFactor + this.parent.minGroundHeight;
		const minHeight = (+tags.minHeight || 0) * heightFactor + this.parent.minGroundHeight;
		const vertices: number[] = [];

		for (let i = 0; i < this.vertices.length - 1; i++) {
			const vertex = {x: this.vertices[i][0], z: this.vertices[i][1]};
			const nextVertex = {x: this.vertices[i + 1][0], z: this.vertices[i + 1][1]};

			vertices.push(nextVertex.x, minHeight, nextVertex.z);
			vertices.push(vertex.x, height, vertex.z);
			vertices.push(vertex.x, minHeight, vertex.z);

			vertices.push(nextVertex.x, minHeight, nextVertex.z);
			vertices.push(nextVertex.x, height, nextVertex.z);
			vertices.push(vertex.x, height, vertex.z);
		}

		return vertices;
	}
}