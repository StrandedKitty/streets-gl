import Vec2 from "~/lib/math/Vec2";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";
import Road from "~/lib/road-graph/Road";
import IntersectionPolygonBuilder, {Segment} from "~/lib/road-graph/IntersectionPolygonBuilder";

export interface IntersectionDirection {
	road: Road<unknown>;
	vertex: LinkedVertex;
	trimmedEnd?: Vec2;
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
		const segments: Segment[] = [];

		for (const direction of this.directions) {
			const segment = builder.addDirection(direction.vertex.vector, direction.road.width);

			segments.push(segment);
		}

		const polygon = builder.getPolygon();

		for (let i = 0; i < segments.length; i++) {
			this.directions[i].trimmedEnd = segments[i].getTrimmedEnd();
		}

		return polygon;
	}
}