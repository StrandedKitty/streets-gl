import Vec2 from "~/lib/math/Vec2";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";

export default class Road {
	public readonly width: number;
	public readonly vertices: LinkedVertex[] = [];
	private readonly startVertex: LinkedVertex = null;
	private readonly endVertex: LinkedVertex = null;

	public constructor(vertices: Vec2[], width: number) {
		this.width = width;

		const isClosed = vertices[0].equals(vertices[vertices.length - 1]);
		const vertexCount = vertices.length - (isClosed ? 1 : 0);

		for (let i = 0; i < vertexCount; i++) {
			const linked = new LinkedVertex(vertices[i]);

			if (this.vertices.length > 0) {
				const prev = this.vertices[this.vertices.length - 1];
				linked.prev = prev;
				prev.next = linked;
			}

			this.vertices.push(linked);
		}

		const first = this.vertices[0];
		const last = this.vertices[this.vertices.length - 1];

		if (isClosed) {
			last.next = first;
			first.prev = last;
		} else {
			this.startVertex = first;
			this.endVertex = last;
		}
	}

	public get start(): LinkedVertex | null {
		return this.startVertex;
	}

	public get end(): LinkedVertex | null {
		return this.endVertex;
	}
}