import Vec2 from "../../math/Vec2";
import {toDeg} from "../../math/Utils";
import DoubleTouchHandler, {DoubleTouchMoveEvent} from "./DoubleTouchHandler";

const rotationThreshold = 10;

export default class TouchRotateHandler extends DoubleTouchHandler {
	private minDiameter: number;
	private startVector: Vec2;
	private vector: Vec2;

	constructor() {
		super();
	}

	start(touchA: Vec2, touchB: Vec2) {
		this.startVector = this.vector = Vec2.sub(touchA, touchB);
		this.minDiameter = Vec2.distance(touchA, touchB);
	}

	move(touchA: Vec2, touchB: Vec2, e: TouchEvent): DoubleTouchMoveEvent {
		const lastVector = this.vector;
		this.vector = Vec2.sub(touchA, touchB);

		if (this.isBelowThreshold(this.vector)) {
			return {};
		}

		this.active = true;

		return {
			bearingDelta: this.getBearingDelta(this.vector, lastVector)
		};
	}

	private isBelowThreshold(vector: Vec2): boolean {
		this.minDiameter = Math.min(this.minDiameter, Vec2.getLength(vector));
		const circumference = Math.PI * this.minDiameter;
		const threshold = rotationThreshold / circumference * 360;

		const bearingDeltaSinceStart = this.getBearingDelta(vector, this.startVector);
		return Math.abs(bearingDeltaSinceStart) < threshold;
	}

	private getBearingDelta(a: Vec2, b: Vec2): number {
		const angle = Math.atan2(
			a.x * b.y - a.y * b.x,
			a.x * b.x + a.y * b.y
		);

		return toDeg(angle);
	}
}
