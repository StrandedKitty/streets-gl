import Vec2 from "~/lib/math/Vec2";
import Road from "~/lib/road-graph/Road";
import Intersection from "~/lib/road-graph/Intersection";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";

interface Group<T> {
	roads: Road<T>[];
	intersections: Intersection<T>[];
	intersectionMap: Map<string, Intersection<T>>;
}

export default class RoadGraph<RoadRef> {
	private groups: Map<number, Group<RoadRef>> = new Map();

	public addRoad(ref: RoadRef, vertices: Vec2[], width: number, groupId: number): Road<RoadRef> {
		const group = this.getGroup(groupId);
		const road = new Road(ref, vertices, width);
		group.roads.push(road);

		return road;
	}

	private getGroup(id: number): Group<RoadRef> {
		if (!this.groups.has(id)) {
			this.groups.set(id, {
				roads: [],
				intersections: [],
				intersectionMap: new Map()
			});
		}

		return this.groups.get(id);
	}

	public initIntersections(): void {
		for (const group of this.groups.values()) {
			const intersectionPoints: Map<string, [LinkedVertex, Road<RoadRef>][]> = new Map();

			for (const road of group.roads) {
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
				const intersection = new Intersection<RoadRef>(center);

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
					group.intersections.push(intersection);
					group.intersectionMap.set(
						point[0][0].getDeserializedVector(),
						intersection
					);
				}
			}
		}
	}

	public buildIntersectionPolygons(groupId: number): {
		intersection: Intersection<RoadRef>;
		polygon: Vec2[];
	}[] {
		const group = this.getGroup(groupId);
		const polygons: {intersection: Intersection<RoadRef>; polygon: Vec2[]}[] = [];

		for (const intersection of group.intersections) {
			if (intersection.directions.length > 2) {
				polygons.push({intersection, polygon: intersection.getPolygon()});
			}
		}

		return polygons;
	}

	public getIntersectionByPoint(point: Vec2, groupId: number): Intersection<RoadRef> {
		const group = this.getGroup(groupId);

		return group.intersectionMap.get(`${point.x} ${point.y}`);
	}
}