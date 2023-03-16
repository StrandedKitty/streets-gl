import Vec2 from "~/lib/math/Vec2";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";
import Road from "~/lib/road-graph/Road";
import IntersectionPolygonBuilder from "~/lib/road-graph/IntersectionPolygonBuilder";

export interface IntersectionDirection {
	road: Road<unknown>;
	vertex: LinkedVertex;
}

export default class Intersection {
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

	public getPolygon(): Vec2[] {
		const builder = new IntersectionPolygonBuilder(this.center);

		for (const direction of this.directions) {
			builder.addDirection(direction.vertex.vector, direction.road.width);
		}

		return builder.getPolygon();
	}
}