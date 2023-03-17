import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";

export class LineIntersection {
	public point: Vec2;
	public isProjected: boolean;
	public alpha: number;

	public constructor(point: Vec2, isProjected: boolean) {
		this.point = point;
		this.isProjected = isProjected;
		this.alpha = 0;
	}
}

export class Segment {
	private readonly start: Vec2;
	private readonly end: Vec2;
	private readonly width: number;
	public readonly angle: number;
	private readonly leftDirection: Vec2;
	private readonly rightDirection: Vec2;
	public segmentLeft: [Vec2, Vec2];
	public segmentRight: [Vec2, Vec2];
	public segmentLeftIntersections: LineIntersection[] = [];
	public segmentRightIntersections: LineIntersection[] = [];
	public trimTo: LineIntersection = null;

	public constructor(start: Vec2, end: Vec2, width: number) {
		this.start = start;
		this.end = end;
		this.width = width;

		const direction = Vec2.normalize(Vec2.sub(start, end));
		this.leftDirection = Vec2.rotateLeft(direction);
		this.rightDirection = Vec2.rotateRight(direction);

		this.segmentLeft = [
			Vec2.add(start, Vec2.multiplyScalar(this.leftDirection, this.width / 2)),
			Vec2.add(end, Vec2.multiplyScalar(this.leftDirection, this.width / 2)),
		];
		this.segmentRight = [
			Vec2.add(start, Vec2.multiplyScalar(this.rightDirection, this.width / 2)),
			Vec2.add(end, Vec2.multiplyScalar(this.rightDirection, this.width / 2)),
		];

		this.angle = direction.getAngle();

		this.segmentLeftIntersections.push(new LineIntersection(this.segmentLeft[1], true));
		this.segmentRightIntersections.push(new LineIntersection(this.segmentRight[1], true));

		this.segmentLeft[0] = Vec2.add(this.segmentLeft[0], Vec2.multiplyScalar(direction, this.width));
		this.segmentRight[0] = Vec2.add(this.segmentRight[0], Vec2.multiplyScalar(direction, this.width));
		this.segmentLeft[1] = Vec2.add(this.segmentLeft[1], Vec2.multiplyScalar(direction, -16));
		this.segmentRight[1] = Vec2.add(this.segmentRight[1], Vec2.multiplyScalar(direction, -16));
	}

	public projectIntersections(): void {
		for (const intersection of this.segmentLeftIntersections) {
			if (intersection.isProjected) {
				continue;
			}

			this.segmentRightIntersections.push(new LineIntersection(
				Vec2.add(intersection.point, Vec2.multiplyScalar(this.rightDirection, this.width)),
				true
			));
		}
		for (const intersection of this.segmentRightIntersections) {
			if (intersection.isProjected) {
				continue;
			}

			this.segmentLeftIntersections.push(new LineIntersection(
				Vec2.add(intersection.point, Vec2.multiplyScalar(this.leftDirection, this.width)),
				true
			));
		}
	}

	public updateIntersectionsAlpha(): void {
		this.updateIntersectionsAlphaForSide(this.segmentRightIntersections, this.segmentRight);
		this.updateIntersectionsAlphaForSide(this.segmentLeftIntersections, this.segmentLeft);
	}

	public updateIntersectionsAlphaForSide(intersections: LineIntersection[], segment: [Vec2, Vec2]): void {
		for (const intersection of intersections) {
			intersection.alpha = MathUtils.getPointProgressAlongLineSegment(
				segment[0],
				segment[1],
				intersection.point
			);
		}
	}

	public sortIntersectionsByAlpha(): void {
		const compare = (a: LineIntersection, b: LineIntersection): number => a.alpha - b.alpha;
		this.segmentLeftIntersections.sort(compare);
		this.segmentRightIntersections.sort(compare);
	}

	public getTrimmedEnd(): Vec2 {
		if (!this.trimTo) {
			return this.end;
		}

		const progress = MathUtils.getPointProgressAlongLineSegment(this.start, this.end, this.trimTo.point, true);

		return Vec2.lerp(this.start, this.end, progress);
	}
}

export default class IntersectionPolygonBuilder {
	private readonly center: Vec2;
	private readonly segments: Segment[] = [];

	public constructor(center: Vec2) {
		this.center = center;
	}

	public addDirection(point: Vec2, width: number): Segment {
		const segment = new Segment(point, this.center, width);

		this.segments.push(segment);

		return segment;
	}

	public getPolygon(): Vec2[] {
		if (this.segments.length < 3) {
			throw new Error('Intersection must have at least 3 directions');
		}

		this.sortSegments();

		for (let i = 0; i < this.segments.length; i++) {
			const segment = this.segments[i];
			const nextSegment = this.segments[(i + 1) % this.segments.length];
			const leftThis = segment.segmentLeft;
			const rightNext = nextSegment.segmentRight;

			const intersection: [number, number] = MathUtils.getIntersectionLineLine(
				Vec2.toArray(leftThis[0]),
				Vec2.toArray(leftThis[1]),
				Vec2.toArray(rightNext[0]),
				Vec2.toArray(rightNext[1])
			);

			if (intersection) {
				const vector = new Vec2(intersection[0], intersection[1]);
				segment.segmentLeftIntersections.push(new LineIntersection(vector, false));
				nextSegment.segmentRightIntersections.push(new LineIntersection(vector, false));
			}
		}

		for (const segment of this.segments) {
			segment.projectIntersections();
			segment.updateIntersectionsAlpha();
			segment.sortIntersectionsByAlpha();
		}

		const polygon: Vec2[] = [];

		for (const segment of this.segments) {
			const p1 = segment.segmentRightIntersections[0];
			const p2 = segment.segmentLeftIntersections[0];

			if (p1.isProjected) {
				const additional = segment.segmentRightIntersections.find(p => !p.isProjected);

				if (additional) {
					polygon.push(additional.point);
				}
			}

			polygon.push(p1.point);
			polygon.push(p2.point);

			if (p2.isProjected) {
				const additional = segment.segmentLeftIntersections.find(p => !p.isProjected);

				if (additional) {
					polygon.push(additional.point);
				}
			}

			segment.trimTo = p1;
		}

		return polygon;
	}

	private sortSegments(): void {
		this.segments.sort((a, b) => a.angle - b.angle);
	}
}