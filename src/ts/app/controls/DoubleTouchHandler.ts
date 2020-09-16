import Vec2 from "../../math/Vec2";

export interface DoubleTouchMoveEvent {
	zoomDelta?: number;
	pitchDelta?: number;
	bearingDelta?: number;
}

export default abstract class DoubleTouchHandler {
	protected firstTwoTouches: [number, number] = null;
	public active = false;
	public onMove: (e: DoubleTouchMoveEvent) => void;

	protected constructor() {

	}

	protected reset() {
		this.active = false;
		this.firstTwoTouches = null;
	}

	public touchStart(e: TouchEvent, touches: Map<number, Vec2>) {
		if (this.firstTwoTouches || touches.size < 2) {
			return;
		}

		const touchesArray = Array.from(touches.values());
		const touchesIdsArray = Array.from(touches.keys());

		this.firstTwoTouches = [
			touchesIdsArray[0],
			touchesIdsArray[1]
		];

		this.start(touchesArray[0], touchesArray[1]);
	}

	public touchMove(e: TouchEvent, touches: Map<number, Vec2>) {
		if (!this.firstTwoTouches) {
			return;
		}

		const [idA, idB] = this.firstTwoTouches;
		const a = touches.get(idA);
		const b = touches.get(idB);
		if (!a || !b) return;

		this.onMove(this.move(a, b, e));
	}

	public touchEnd(e: TouchEvent, touches: Map<number, Vec2>) {
		if (!this.firstTwoTouches || touches.get(this.firstTwoTouches[0]) && touches.get(this.firstTwoTouches[1])) {
			return;
		}

		this.reset();
	}

	public touchCancel() {
		this.reset();
	}

	public abstract start(touchA: Vec2, touchB: Vec2): void;
	public abstract move(touchA: Vec2, touchB: Vec2, e: TouchEvent): DoubleTouchMoveEvent;
}
