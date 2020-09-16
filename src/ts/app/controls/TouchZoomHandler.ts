import DoubleTouchHandler, {DoubleTouchMoveEvent} from "./DoubleTouchHandler";
import Vec2 from "../../math/Vec2";

const zoomThreshold = 0.01;

export default class TouchZoomHandler extends DoubleTouchHandler {
	private distance: number = null;
	private startDistance: number = null;

	constructor() {
		super();
	}

	public reset() {
		super.reset();
		this.distance = null;
		this.startDistance = null;
	}

	public start(touchA: Vec2, touchB: Vec2) {
		this.startDistance = this.distance = Vec2.distance(touchA, touchB);
	}

	public move(touchA: Vec2, touchB: Vec2, e: TouchEvent): DoubleTouchMoveEvent {
		const lastDistance = this.distance;
		this.distance = Vec2.distance(touchA, touchB);

		const zoomDelta = this.getZoomDelta(this.distance, lastDistance);

		if (Math.abs(zoomDelta) < zoomThreshold) {
			return {};
		}

		this.active = true;

		return {
			zoomDelta: this.getZoomDelta(this.distance, lastDistance)
		};
	}

	private getZoomDelta(distance: number, lastDistance: number): number {
		return Math.log(distance / lastDistance);
	}
}
