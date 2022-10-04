import Vec3 from "../../math/Vec3";
import MathUtils from "../../math/MathUtils";
import Camera from "../../core/Camera";
import Vec2 from "../../math/Vec2";
import HeightProvider from "../world/HeightProvider";
import DoubleTouchHandler, {DoubleTouchMoveEvent} from "../controls/DoubleTouchHandler";
import TouchZoomHandler from "../controls/TouchZoomHandler";
import TouchRotateHandler from "../controls/TouchRotateHandler";
import {TouchPinchHandler} from "../controls/TouchPinchHandler";
import URLControlsStateHandler from "../controls/URLControlsStateHandler";
import Config from "../Config";
import System from "../System";
import SystemManager from "../SystemManager";
import CursorStyleSystem from "./CursorStyleSystem";
import SceneSystem from '~/app/systems/SceneSystem';
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Easing from "../../math/Easing";

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
	private tick = 0;
	public target: Vec3 = new Vec3();
	private direction: Vec3 = new Vec3();
	private normalizedDistance = 10;
	private normalizedDistanceTarget = 10;
	private distance = 0;
	private pitch: number = MathUtils.toRad(45);
	private yaw: number = MathUtils.toRad(0);
	private state: ControlsState;
	private urlHandler: URLControlsStateHandler = new URLControlsStateHandler();
	private wheelZoomScale: number = 0;
	private wheelZoomScaleTarget: number = 0;

	private isRotationMouseMode = false;
	private isMovementMouseMode = false;
	private mouseDownPosition: Vec2 = null;
	private touches: Map<number, Vec2> = new Map();
	private cachedMoveEvent: Vec2 = null;
	private readonly touchHandlers: Map<string, DoubleTouchHandler>;

	private readonly rotationSpeed = 0.25;
	private readonly movementSpeed = 1;

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		this.element = <HTMLCanvasElement>document.getElementById('canvas');

		this.touchHandlers = new Map<string, DoubleTouchHandler>([
			['zoom', new TouchZoomHandler()],
			['rotate', new TouchRotateHandler()],
			['pinch', new TouchPinchHandler()]
		]);

		for (const handler of this.touchHandlers.values()) {
			handler.onMove = (e: DoubleTouchMoveEvent): void => this.onDoubleTouchMove(e);
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
				distance: 2 ** this.normalizedDistance
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

	public postInit(): void {

	}

	public getLatLon(): {lat: number; lon: number} {
		return MathUtils.meters2degrees(this.target.x, this.target.z);
	}

	public setLatLon(lat: number, lon: number): void {
		const position = MathUtils.degrees2meters(lat, lon);

		this.state.x = position.x;
		this.state.z = position.y;

		this.updatePositionFromState(this.state);
	}

	private updateStateFromPosition(): void {
		this.state.x = this.target.x;
		this.state.z = this.target.z;
		this.state.pitch = this.pitch;
		this.state.yaw = this.yaw;
		this.state.distance = 2 ** this.normalizedDistance;
	}

	private updatePositionFromState(state: ControlsState): void {
		this.target.x = state.x;
		this.target.z = state.z;
		this.pitch = state.pitch;
		this.yaw = state.yaw;
		this.normalizedDistance = this.normalizedDistanceTarget = Math.log2(state.distance);
	}

	private wheelEvent(e: WheelEvent): void {
		e.preventDefault();

		if (e.ctrlKey) {
			this.normalizedDistanceTarget += e.deltaY / 200.;
			return;
		}

		this.normalizedDistanceTarget += e.deltaY / 2000.;
	}

	private mouseDownEvent(e: MouseEvent): void {
		e.preventDefault();

		switch (e.button) {
			case 0: {
				this.isMovementMouseMode = true;
				this.mouseDownPosition = this.projectOnGround(e.clientX, e.clientY);
				break;
			}
			case 1: {
				this.wheelZoomScaleTarget = 1;
				break;
			}
			case 2: {
				this.isRotationMouseMode = true;
				break;
			}
		}
	}

	private mouseLeaveEvent(e: MouseEvent): void {
		this.systemManager.getSystem(CursorStyleSystem).disableGrabbing();

		this.isRotationMouseMode = false;
		this.isMovementMouseMode = false;
		this.mouseDownPosition = null;
		this.cachedMoveEvent = null;
	}

	private mouseUpEvent(e: MouseEvent): void {
		this.systemManager.getSystem(CursorStyleSystem).disableGrabbing();

		switch (e.button) {
			case 0: {
				this.isMovementMouseMode = false;
				this.mouseDownPosition = null;
				this.cachedMoveEvent = null;
				break;
			}
			case 1: {
				this.wheelZoomScaleTarget = 0;
				break;
			}
			case 2: {
				this.isRotationMouseMode = false;
				break;
			}
		}
	}

	private mouseMoveEvent(e: MouseEvent): void {
		if (this.isRotationMouseMode || this.isMovementMouseMode) {
			this.systemManager.getSystem(CursorStyleSystem).enableGrabbing();
		}

		if (this.isRotationMouseMode) {
			this.yaw += MathUtils.toRad(e.movementX) * this.rotationSpeed;
			this.pitch += MathUtils.toRad(e.movementY) * this.rotationSpeed;
		}

		if (this.isMovementMouseMode) {
			this.cachedMoveEvent = new Vec2(e.clientX, e.clientY);
		}
	}

	private touchStartEvent(e: TouchEvent): void {
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

	private touchEndEvent(e: TouchEvent): void {
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

	private touchMoveEvent(e: TouchEvent): void {
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

	private onDoubleTouchMove(e: DoubleTouchMoveEvent): void {
		if (e.zoomDelta && !this.touchHandlers.get('pinch').active) {
			this.normalizedDistanceTarget -= e.zoomDelta * this.normalizedDistanceTarget;
		}

		if (e.bearingDelta && !this.touchHandlers.get('pinch').active) {
			this.yaw += MathUtils.toRad(e.bearingDelta) * this.rotationSpeed * touchYawFactor;
		}

		if (e.pinchDelta) {
			this.pitch -= MathUtils.toRad(e.pinchDelta) * this.rotationSpeed * touchPitchFactor;
		}
	}

	private moveTarget(dx: number, dy: number): void {
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

	private updateDistance(): void {
		const min = Math.log2(Config.MinCameraDistance);
		const max = Math.log2(Config.MaxCameraDistance);

		this.normalizedDistanceTarget = MathUtils.clamp(this.normalizedDistanceTarget, min, max);

		this.normalizedDistance = MathUtils.lerp(
			this.normalizedDistance,
			this.normalizedDistanceTarget,
			Config.CameraZoomSmoothing
		);

		this.distance = 2 ** this.normalizedDistance;
	}

	private updateTargetHeightFromHeightmap(): void {
		const tileSpacePosition = MathUtils.meters2tile(this.target.x, this.target.z);
		const tilePosition = new Vec2(Math.floor(tileSpacePosition.x), Math.floor(tileSpacePosition.y));

		if (HeightProvider.getTile(tilePosition.x, tilePosition.y)) {
			this.target.y = HeightProvider.getHeight(tilePosition.x, tilePosition.y, tileSpacePosition.x % 1, tileSpacePosition.y % 1);
		}
	}

	private updateHash(): void {
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
	}

	public update(deltaTime: number): void {
		this.camera = this.systemManager.getSystem(SceneSystem).objects.camera;

		this.updateTargetHeightFromHeightmap();
		this.updateDistance();

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

		if (this.cachedMoveEvent && this.mouseDownPosition && !this.touchHandlers.get('pinch').active) {
			this.camera.updateMatrixWorld();

			const positionOnGround = this.projectOnGround(this.cachedMoveEvent.x, this.cachedMoveEvent.y);
			const movementDelta = Vec2.sub(this.mouseDownPosition, positionOnGround);

			this.moveTarget(movementDelta.x, movementDelta.y);

			const cameraOffset = Vec3.multiplyScalar(this.direction, this.distance);
			const cameraPosition = Vec3.add(this.target, cameraOffset);

			this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
			this.camera.lookAt(this.target, false);
		}

		if (this.wheelZoomScaleTarget !== this.wheelZoomScale) {
			const sign = Math.sign(this.wheelZoomScaleTarget - this.wheelZoomScale);

			this.wheelZoomScale += sign * deltaTime * 12.;
			this.wheelZoomScale = MathUtils.clamp(this.wheelZoomScale, 0, 1);

			const alpha = Easing.easeOutCubic(this.wheelZoomScale);

			this.camera.zoom(MathUtils.lerp(1, Config.CameraFOV / Config.CameraFOVZoomed, alpha));
		}

		this.updateHash();

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();

		++this.tick;
	}
}
