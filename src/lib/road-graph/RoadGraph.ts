import Vec2 from "~/lib/math/Vec2";

export class LinkedVertex {
	public next: LinkedVertex = null;
	public prev: LinkedVertex = null;
	public vector: Vec2;

	public constructor(vector: Vec2) {
		this.vector = vector;
	}

	public getDeserializedVector(): string {
		return `${this.vector.x} ${this.vector.y}`;
	}
}

export class Road<Reference> {
	public readonly ref: Reference;
	public readonly vertices: LinkedVertex[] = [];
	private readonly startVertex: LinkedVertex = null;
	private readonly endVertex: LinkedVertex = null;

	public constructor(ref: Reference, vertices: Vec2[]) {
		this.ref = ref;

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

export interface IntersectionDirection {
	road: Road<unknown>;
	vertex: LinkedVertex;
}

export class Intersection {
	public center: Vec2;
	public directions: IntersectionDirection[] = [];

	public constructor(center: Vec2) {
		this.center = center;
	}

	public addDirection(road: Road<unknown>, vertex: LinkedVertex): void {
		const direction: IntersectionDirection = {
			road,
			vertex
		};

		this.directions.push(direction);
	}
}

export default class RoadGraph<RoadReference> {
	private roads: Road<RoadReference>[] = [];
	private intersections: Intersection[] = [];
	private intersectionMap: Map<string, Intersection> = new Map();

	public constructor() {
	}

	public addRoad(ref: RoadReference, vertices: Vec2[]): Road<RoadReference> {
		const road = new Road(ref, vertices);
		this.roads.push(road);

		return road;
	}

	public initIntersections(): void {
		const intersectionPoints: Map<string, [LinkedVertex, Road<RoadReference>][]> = new Map();

		for (const road of this.roads) {
			for (const vertex of road.vertices) {
				const key = vertex.getDeserializedVector();

				if (!intersectionPoints.has(key)) {
					intersectionPoints.set(key, []);
				}

				intersectionPoints.get(key).push([vertex, road]);
			}
		}

		for (const point of intersectionPoints.values()) {
			if (point.length < 2) {
				continue;
			}

			const center = point[0][0].vector;
			const intersection = new Intersection(center);

			for (const [vertex, road] of point) {
				const next = vertex.next;
				const prev = vertex.prev;

				if (next) {
					intersection.addDirection(road, next);
				}
				if (prev) {
					intersection.addDirection(road, prev);
				}
			}

			if (intersection.directions.length > 1) {
				this.intersections.push(intersection);
				this.intersectionMap.set(
					point[0][0].getDeserializedVector(),
					intersection
				);
			}
		}
	}

	public getIntersectionByPoint(point: Vec2): Intersection {
		return this.intersectionMap.get(`${point.x} ${point.y}`);
	}
}