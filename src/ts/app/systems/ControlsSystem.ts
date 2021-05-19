import Vec3 from "../../math/Vec3";
import MathUtils from "../../math/MathUtils";
import Camera from "../../core/Camera";
import Vec2 from "../../math/Vec2";
import HeightProvider from "../world/HeightProvider";
import DoubleTouchHandler, {DoubleTouchMoveEvent} from "../controls/DoubleTouchHandler";
import TouchZoomHandler from "../controls/TouchZoomHandler";
import TouchRotateHandler from "../controls/TouchRotateHandler";
import {TouchPitchHandler} from "../controls/TouchPitchHandler";
import URLControlsStateHandler from "../controls/URLControlsStateHandler";
import Config from "../Config";
import System from "../System";
import SystemManager from "../SystemManager";
import CursorStyleSystem from "./CursorStyleSystem";
import RenderSystem from "./RenderSystem";

const touchYawFactor = 4;
const touchPitchFactor = 2;

export interface ControlsState {
	x: number;
	z: number;
	pitch: number;
	yaw: number;
	distance: number;
}

export default class ControlsSystem extends System {
	private element: HTMLElement;
	private camera: Camera;
	private tick: number = 0;
	public target: Vec3 = new Vec3();
	private direction: Vec3 = new Vec3();
	private distance: number = 1000;
	private distanceTarget: number = 1000;
	private pitch: number = MathUtils.toRad(45);
	private yaw: number = MathUtils.toRad(0);
	private state: ControlsState;
	private urlHandler: URLControlsStateHandler = new URLControlsStateHandler();

	private isRotationMouseMode: boolean = false;
	private isMovementMouseMode: boolean = false;
	private mouseDownPosition: Vec2 = null;
	private touches: Map<number, Vec2> = new Map();
	private cachedMoveEvent: Vec2 = null;
	private readonly touchHandlers: Map<string, DoubleTouchHandler>;

	private readonly rotationSpeed = 0.25;
	private readonly movementSpeed = 1;

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.element = <HTMLCanvasElement>document.getElementById('canvas');

		this.touchHandlers = new Map<string, DoubleTouchHandler>([
			['zoom', new TouchZoomHandler()],
			['rotate', new TouchRotateHandler()],
			['pitch', new TouchPitchHandler()]
		]);

		for (const handler of this.touchHandlers.values()) {
			handler.onMove = (e: DoubleTouchMoveEvent) => this.onDoubleTouchMove(e);
		}

		const [newState] = this.urlHandler.getStateFromHash();

		if (newState) {
			this.state = newState;
			this.updatePositionFromState(this.state);
		} else {
			const startPosition = MathUtils.degrees2meters(Config.StartPosition[0], Config.StartPosition[1]);

			this.state = {
				x: startPosition.x,
				z: startPosition.y,
				pitch: this.pitch,
				yaw: this.yaw,
				distance: this.distance
			}

			this.updatePositionFromState(this.state);
		}

		this.element.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseleave', (e: MouseEvent) => this.mouseLeaveEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));
		this.element.addEventListener('touchstart', (e: TouchEvent) => this.touchStartEvent(e));
		this.element.addEventListener('touchend', (e: TouchEvent) => this.touchEndEvent(e));
		this.element.addEventListener('touchmove', (e: TouchEvent) => this.touchMoveEvent(e));
	}

	public postInit() {

	}

	public getLatLon(): {lat: number, lon: number} {
		return MathUtils.meters2degrees(this.target.x, this.target.z);
	}

	private updateStateFromPosition() {
		this.state.x = this.target.x;
		this.state.z = this.target.z;
		this.state.pitch = this.pitch;
		this.state.yaw = this.yaw;
		this.state.distance = this.distance;
	}

	private updatePositionFromState(state: ControlsState) {
		this.target.x = state.x;
		this.target.z = state.z;
		this.pitch = state.pitch;
		this.yaw = state.yaw;
		this.distance = state.distance;
		this.distanceTarget = state.distance;
	}

	private wheelEvent(e: WheelEvent) {
		this.distanceTarget += 0.5 * e.deltaY;
	}

	private mouseDownEvent(e: MouseEvent) {
		e.preventDefault();

		this.systemManager.getSystem(CursorStyleSystem).enableGrabbing();

		if (e.button && e.button == 2) {
			this.isRotationMouseMode = true
		} else {
			this.isMovementMouseMode = true;
			this.mouseDownPosition = this.projectOnGround(e.clientX, e.clientY);
		}
	}

	private mouseLeaveEvent(e: MouseEvent) {
		this.systemManager.getSystem(CursorStyleSystem).disableGrabbing();

		this.isRotationMouseMode = false
		this.isMovementMouseMode = false;
		this.mouseDownPosition = null;
		this.cachedMoveEvent = null;
	}

	private mouseUpEvent(e: MouseEvent) {
		this.systemManager.getSystem(CursorStyleSystem).disableGrabbing();

		if (e.button && e.button == 2)
			this.isRotationMouseMode = false
		else {
			this.isMovementMouseMode = false;
			this.mouseDownPosition = null;
			this.cachedMoveEvent = null;
		}
	}

	private mouseMoveEvent(e: MouseEvent) {
		if (this.isRotationMouseMode) {
			this.yaw += MathUtils.toRad(e.movementX) * this.rotationSpeed;
			this.pitch += MathUtils.toRad(e.movementY) * this.rotationSpeed;
		}

		if (this.isMovementMouseMode) {
			this.cachedMoveEvent = new Vec2(e.clientX, e.clientY);
		}
	}

	private touchStartEvent(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			this.touches.set(touch.identifier, new Vec2(touch.clientX, touch.clientY));
		}

		const touchesSum = new Vec2();
		for (const touch of this.touches.values()) {
			touchesSum.x += touch.x;
			touchesSum.y += touch.y;
		}
		this.mouseDownPosition = this.projectOnGround(touchesSum.x / this.touches.size, touchesSum.y / this.touches.size);
		this.cachedMoveEvent = null;

		for (const handler of this.touchHandlers.values()) {
			handler.touchStart(e, this.touches);
		}
	}

	private touchEndEvent(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			this.touches.delete(touch.identifier);
		}

		this.mouseDownPosition = null;
		this.cachedMoveEvent = null;

		for (const handler of this.touchHandlers.values()) {
			handler.touchEnd(e, this.touches);
		}
	}

	private touchMoveEvent(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			this.touches.set(touch.identifier, new Vec2(touch.clientX, touch.clientY));
		}

		const touchesSum = new Vec2();
		for (const touch of this.touches.values()) {
			touchesSum.x += touch.x;
			touchesSum.y += touch.y;
		}

		this.cachedMoveEvent = new Vec2(touchesSum.x / this.touches.size, touchesSum.y / this.touches.size)

		if (this.touches.size > 1) {
			for (const handler of this.touchHandlers.values()) {
				handler.touchMove(e, this.touches);
			}
		}
	}

	private onDoubleTouchMove(e: DoubleTouchMoveEvent) {
		if (e.zoomDelta && !this.touchHandlers.get('pitch').active) {
			this.distanceTarget -= e.zoomDelta * this.distanceTarget;
		}

		if (e.bearingDelta && !this.touchHandlers.get('pitch').active) {
			this.yaw += MathUtils.toRad(e.bearingDelta) * this.rotationSpeed * touchYawFactor;
		}

		if (e.pitchDelta) {
			this.pitch -= MathUtils.toRad(e.pitchDelta) * this.rotationSpeed * touchPitchFactor;
		}
	}

	private moveTarget(dx: number, dy: number) {
		const v = Vec2.multiplyScalar(new Vec2(dx, dy), this.movementSpeed);

		const v2 = new Vec2();

		const sin = Math.sin(this.yaw);
		const cos = Math.cos(this.yaw);
		v2.x = (cos * v.x) - (sin * v.y);
		v2.y = (sin * v.x) + (cos * v.y);

		this.target.x += v.x;
		this.target.z += v.y;
	}

	private projectOnGround(clientX: number, clientY: number): Vec2 {
		const screenPos = new Vec2(clientX, clientY);
		const screenSize = new Vec2(window.innerWidth, window.innerHeight);
		let vector = Vec3.unproject(new Vec3(
			screenPos.x / screenSize.x * 2 - 1,
			-screenPos.y / screenSize.y * 2 + 1,
			0.5
		), this.camera, false);

		vector = Vec3.sub(vector, this.camera.position);
		vector.y *= 1;

		const distanceToGround = (this.camera.position.y - this.target.y) / vector.y;
		const vectorToGround = Vec3.multiplyScalar(vector, distanceToGround);
		const positionOnGround = Vec3.sub(this.camera.position, vectorToGround);

		return new Vec2(positionOnGround.x, positionOnGround.z);
	}

	public update(deltaTile: number) {
		this.camera = this.systemManager.getSystem(RenderSystem).camera;

		const tile = MathUtils.meters2tile(this.target.x, this.target.z);
		const tilePosition = new Vec2(Math.floor(tile.x), Math.floor(tile.y));

		if (HeightProvider.getTile(tilePosition.x, tilePosition.y)) {
			this.target.y = HeightProvider.getHeight(tilePosition.x, tilePosition.y, tile.x % 1, tile.y % 1);
		}

		this.distanceTarget = MathUtils.clamp(
			this.distanceTarget,
			Config.MinCameraDistance,
			Config.MaxCameraDistance
		);

		if (Math.abs(this.distance - this.distanceTarget) < 0.01) {
			this.distance = this.distanceTarget;
		} else {
			this.distance = MathUtils.lerp(this.distance, this.distanceTarget, 0.4);
		}

		this.pitch = MathUtils.clamp(
			this.pitch,
			MathUtils.toRad(Config.MinCameraPitch),
			MathUtils.toRad(Config.MaxCameraPitch)
		);
		this.yaw = MathUtils.normalizeAngle(this.yaw);

		this.direction = Vec3.normalize(MathUtils.sphericalToCartesian(this.yaw, -this.pitch));

		const cameraOffset = Vec3.multiplyScalar(this.direction, this.distance);
		const cameraPosition = Vec3.add(this.target, cameraOffset);

		this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
		this.camera.lookAt(this.target, false);

		if (this.cachedMoveEvent && this.mouseDownPosition && !this.touchHandlers.get('pitch').active) {
			this.camera.updateMatrixWorld();

			const positionOnGround = this.projectOnGround(this.cachedMoveEvent.x, this.cachedMoveEvent.y);
			const movementDelta = Vec2.sub(this.mouseDownPosition, positionOnGround);

			this.moveTarget(movementDelta.x, movementDelta.y);

			const cameraOffset = Vec3.multiplyScalar(this.direction, this.distance);
			const cameraPosition = Vec3.add(this.target, cameraOffset);

			this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
			this.camera.lookAt(this.target, false);
		}

		const [newState, changedByUser] = this.urlHandler.getStateFromHash();

		if (newState && changedByUser) {
			this.updatePositionFromState(newState);
			this.state = newState;
		} else {
			this.updateStateFromPosition();
		}

		if (this.tick % 30 === 0) {
			this.urlHandler.setHashFromState(this.state);
		}

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();

		++this.tick;
	}
}
