import Vec2 from "~/lib/math/Vec2";
import PowerlineSegment from "~/lib/tile-processing/powerline-graph/PowerlineSegment";

export enum NodeType {
	Tower,
	Pole,
	Ground
}

class PowerlineNodeDirection {
	public readonly vector: Vec2;

	public constructor(start: Vec2, end: Vec2) {
		this.vector = Vec2.normalize(Vec2.sub(end, start));
	}
}

export default class PowerlineNode {
	public readonly position: Vec2;
	public readonly directions: PowerlineNodeDirection[] = [];
	public readonly type: NodeType;
	public rotation: number = 0;

	public constructor(type: NodeType, position: Vec2) {
		this.type = type;
		this.position = position;
	}

	public addSegment(segment: PowerlineSegment): void {
		let direction: PowerlineNodeDirection = null;

		if (segment.start.position.equals(this.position)) {
			direction = new PowerlineNodeDirection(this.position, segment.end.position);
		} else if (segment.end.position.equals(this.position)) {
			direction = new PowerlineNodeDirection(this.position, segment.start.position);
		}

		if (direction !== null) {
			this.directions.push(direction);
		}
	}

	public updateRotation(): void {
		if (this.directions.length === 0) {
			return;
		}

		if (this.directions.length === 1) {
			const dir = this.directions[0].vector;

			this.rotation = -dir.getAngle() + Math.PI / 2;
			return;
		}

		let avg = new Vec2(0, 0);

		for (const direction of this.directions) {
			avg = Vec2.add(avg, direction.vector);
		}

		avg = Vec2.normalize(avg);

		if (Vec2.getLength(avg) < 0.5) {
			return;
		}

		this.rotation = -avg.getAngle();
	}
}