import Vec2 from "~/lib/math/Vec2";
import Road from "~/lib/road-graph/Road";
import Intersection from "~/lib/road-graph/Intersection";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";

export default class RoadGraph<RoadReference> {
	private roads: Road<RoadReference>[] = [];
	private intersections: Intersection[] = [];
	private intersectionMap: Map<string, Intersection> = new Map();

	public addRoad(ref: RoadReference, vertices: Vec2[], width: number): Road<RoadReference> {
		const road = new Road(ref, vertices, width);
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

	public buildIntersectionPolygons(): Vec2[][] {
		const polygons: Vec2[][] = [];

		for (const intersection of this.intersections) {
			if (intersection.directions.length > 2) {
				polygons.push(intersection.getPolygon());
			}
		}

		return polygons;
	}

	public getIntersectionByPoint(point: Vec2): Intersection {
		return this.intersectionMap.get(`${point.x} ${point.y}`);
	}
}