import Vec2 from "~/lib/math/Vec2";
import Intersection from "~/lib/road-graph/Intersection";

export default class LinkedVertex {
	public next: LinkedVertex = null;
	public prev: LinkedVertex = null;
	public vector: Vec2;
	private intersection: Intersection = null;

	public constructor(vector: Vec2) {
		this.vector = vector;
	}

	public setIntersection(intersection: Intersection): void {
		if (this.intersection) {
			console.warn("Overwriting existing intersection");
		}

		this.intersection = intersection;
	}

	public getIntersection(): Intersection {
		return this.intersection;
	}
}