import Vec2 from "../../math/Vec2";
import DoubleTouchHandler, {DoubleTouchMoveEvent} from "./DoubleTouchHandler";

const singleTouchTime = 100;

export class TouchPitchHandler extends DoubleTouchHandler {
	public valid: boolean = null;
	public firstMove: number = null;
	public lastPoints: [Vec2, Vec2] = null;

	public constructor() {
		super();
	}

	public reset(): void {
		super.reset();

		this.valid = null;
	}

	public start(touchA: Vec2, touchB: Vec2): void {
		this.lastPoints = [Vec2.copy(touchA), Vec2.copy(touchB)];

		if (TouchPitchHandler.isVectorVertical(Vec2.sub(touchA, touchB))) {
			this.valid = false;
		}
	}

	public move(touchA: Vec2, touchB: Vec2, e: TouchEvent): DoubleTouchMoveEvent {
		const vectorA = Vec2.sub(touchA, this.lastPoints[0]);
		const vectorB = Vec2.sub(touchB, this.lastPoints[1]);

		const zeroVector = new Vec2(0, 0);

		if (vectorA.equals(zeroVector) || vectorB.equals(zeroVector)) {
			return {};
		}

		this.valid = this.gestureBeginsVertically(vectorA, vectorB, e.timeStamp);

		if (!this.valid) {
			return {};
		}

		this.lastPoints = [Vec2.copy(touchA), Vec2.copy(touchB)];
		this.active = true;

		const yDeltaAverage = (vectorA.y + vectorB.y) / 2;
		const degreesPerPixel = -0.5;

		return {
			pitchDelta: yDeltaAverage * degreesPerPixel
		};
	}

	private gestureBeginsVertically(vectorA: Vec2, vectorB: Vec2, timeStamp: number): boolean {
		if (this.valid !== null) {
			return this.valid;
		}

		const movedA = Vec2.getLength(vectorA) > 0;
		const movedB = Vec2.getLength(vectorB) > 0;

		if (!movedA && !movedB) return false;

		if (!movedA || !movedB) {
			if (this.firstMove === undefined) {
				this.firstMove = timeStamp;
			}

			if (timeStamp - this.firstMove < singleTouchTime) {
				return null;
			} else {
				return false;
			}
		}

		const isSameDirection = vectorA.y > 0 === vectorB.y > 0;
		return TouchPitchHandler.isVectorVertical(vectorA) && TouchPitchHandler.isVectorVertical(vectorB) && isSameDirection;
	}

	private static isVectorVertical(v: Vec2): boolean {
		return Math.abs(v.y) > Math.abs(v.x);
	}
}
