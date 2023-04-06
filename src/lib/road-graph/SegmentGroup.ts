import Vec2 from "~/lib/math/Vec2";

class Segment {
	public readonly start: Vec2;
	public readonly end: Vec2;

	public constructor(start: Vec2, end: Vec2) {
		this.start = start;
		this.end = end;
	}

	public getProjectionOnSegment(point: Vec2): Vec2 {
		const v = Vec2.sub(point, this.start);
		const w = Vec2.sub(this.end, this.start);
		const dot = Vec2.dot(v, w);
		const len2 = w.x * w.x + w.y * w.y;

		const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, dot / len2));

		const x = this.start.x + t * w.x;
		const y = this.start.y + t * w.y;

		return new Vec2(x, y);
	}
}

export default class SegmentGroup {
	private readonly segments: Segment[] = [];

	public addSegmentsFromVertices(vertices: Vec2[]): void {
		for (let i = 1; i < vertices.length; i++) {
			this.segments.push(new Segment(vertices[i - 1], vertices[i]));
		}
	}

	public getClosestProjection(point: Vec2): Vec2 {
		let closest: Vec2 = null;
		let closestDistance = Infinity;

		for (const segment of this.segments) {
			const projection = segment.getProjectionOnSegment(point);
			const distance = Vec2.distance(point, projection);

			if (distance < closestDistance) {
				closest = projection;
				closestDistance = distance;
			}
		}

		return closest;
	}
}