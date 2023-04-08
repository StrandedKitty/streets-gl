import Vec2 from "~/lib/math/Vec2";
import Road from "~/lib/road-graph/Road";
import Intersection from "~/lib/road-graph/Intersection";
import LinkedVertex from "~/lib/road-graph/LinkedVertex";
import SegmentGroup from "~/lib/road-graph/SegmentGroup";

interface Group {
	roads: Road[];
	intersections: Intersection[];
	intersectionMap: Map<string, Intersection>;
}

export default class RoadGraph {
	private groups: Map<number, Group> = new Map();
	private segmentGroups: Map<number, SegmentGroup> = new Map();

	public addRoad(vertices: Vec2[], width: number, groupId: number): Road {
		const group = this.getGroup(groupId);
		const road = new Road(vertices, width);
		group.roads.push(road);

		const segmentGroup = this.getSegmentGroup(groupId);
		segmentGroup.addSegmentsFromVertices(vertices);

		return road;
	}

	private getGroup(id: number): Group {
		if (!this.groups.has(id)) {
			this.groups.set(id, {
				roads: [],
				intersections: [],
				intersectionMap: new Map()
			});
		}

		return this.groups.get(id);
	}

	private getSegmentGroup(id: number): SegmentGroup {
		if (!this.segmentGroups.has(id)) {
			this.segmentGroups.set(id, new SegmentGroup());
		}

		return this.segmentGroups.get(id);
	}

	public initIntersections(): void {
		for (const group of this.groups.values()) {
			const intersectionPoints: Map<string, [LinkedVertex, Road][]> = new Map();

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
		intersection: Intersection;
		polygon: Vec2[];
	}[] {
		const group = this.getGroup(groupId);
		const polygons: {intersection: Intersection; polygon: Vec2[]}[] = [];

		for (const intersection of group.intersections) {
			if (intersection.directions.length > 2) {
				polygons.push({intersection, polygon: intersection.getPolygon()});
			}
		}

		return polygons;
	}

	public getIntersectionByPoint(point: Vec2, groupId: number): Intersection {
		const group = this.getGroup(groupId);

		return group.intersectionMap.get(`${point.x} ${point.y}`);
	}

	private getClosestProjectionGlobal(point: Vec2): Vec2 {
		let closest: Vec2 = null;
		let closestDistance = Infinity;

		for (const group of this.segmentGroups.values()) {
			const projection = group.getClosestProjection(point);

			if (!projection) {
				continue;
			}

			const distance = Vec2.distance(point, projection);

			if (distance < closestDistance) {
				closest = projection;
				closestDistance = distance;
			}
		}

		return closest;
	}

	public getClosestProjection(point: Vec2, groupId?: number): Vec2 {
		if (groupId !== undefined) {
			const segmentGroup = this.getSegmentGroup(groupId);

			if (!segmentGroup) {
				return null;
			}

			return segmentGroup.getClosestProjection(point);
		}

		return this.getClosestProjectionGlobal(point);
	}
}