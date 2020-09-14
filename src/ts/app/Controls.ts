import Vec3 from "../math/Vec3";
import {clamp, lerp, meters2tile, normalizeAngle, sphericalToCartesian, toRad} from "../math/Utils";
import Camera from "../core/Camera";
import Vec2 from "../math/Vec2";
import HeightProvider from "./HeightProvider";

export default class Controls {
	private element: HTMLElement;
	private camera: Camera;
	public target: Vec3 = new Vec3();
	private direction: Vec3 = new Vec3();
	private distance: number = 1000;
	private distanceTarget: number = 1000;
	private pitch: number = toRad(45);
	private yaw: number = toRad(0);

	private isRotationMouseDown: boolean = false;
	private isMovementMouseDown: boolean = false;
	private mouseDownPosition: Vec2 = null;
	private touches: Map<number, Vec2> = new Map();
	private cachedMoveEvent: Vec2 = null;

	private readonly rotationSpeed = 0.25;
	private readonly movementSpeed = 1;

	constructor(element: HTMLElement) {
		this.element = element;

		this.element.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));
		this.element.addEventListener('touchstart', (e: TouchEvent) => this.touchStartEvent(e));
		this.element.addEventListener('touchend', (e: TouchEvent) => this.touchEndEvent(e));
		this.element.addEventListener('touchmove', (e: TouchEvent) => this.touchMoveEvent(e));
	}

	private wheelEvent(e: WheelEvent) {
		this.distanceTarget += 0.5 * e.deltaY;
		this.distanceTarget = clamp(this.distanceTarget, 2, 3000);
	}

	private mouseDownEvent(e: MouseEvent) {
		if (e.button && e.button == 2) {
			this.isRotationMouseDown = true
		} else {
			this.isMovementMouseDown = true;
			this.mouseDownPosition = this.projectOnGround(e.clientX, e.clientY);
		}
	}

	private mouseUpEvent(e: MouseEvent) {
		if (e.button && e.button == 2)
			this.isRotationMouseDown = false
		else {
			this.isMovementMouseDown = false;
			this.mouseDownPosition = null;
			this.cachedMoveEvent = null;
		}
	}

	private mouseMoveEvent(e: MouseEvent) {
		if(this.isRotationMouseDown) {
			this.yaw += toRad(e.movementX) * this.rotationSpeed;
			this.pitch += toRad(e.movementY) * this.rotationSpeed;
		}

		if(this.isMovementMouseDown) {
			this.cachedMoveEvent = new Vec2(e.clientX, e.clientY);
		}
	}

	private touchStartEvent(e: TouchEvent) {
		for(let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			this.touches.set(touch.identifier, new Vec2(touch.clientX, touch.clientY));

			this.mouseDownPosition = this.projectOnGround(touch.clientX, touch.clientY);
		}
	}

	private touchEndEvent(e: TouchEvent) {
		for(let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			this.touches.delete(touch.identifier);

			this.mouseDownPosition = null;
			this.cachedMoveEvent = null;
		}
	}

	private touchMoveEvent(e: TouchEvent) {
		const deltas: Vec2[] = [];
		const movementSum = new Vec2();
		let touches = this.touches.size;

		for(let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			const touchStart = this.touches.get(touch.identifier);

			deltas.push(new Vec2(touch.clientX - touchStart.x, touch.clientY - touchStart.y));

			movementSum.x += touch.clientX;
			movementSum.y += touch.clientY;
		}

		if(deltas.length >= 2) {
			const averageDelta = new Vec2();

			for(let i = 0; i < deltas.length; i++) {
				averageDelta.x += deltas[i].x;
				averageDelta.y += deltas[i].y;
			}

			averageDelta.x /= deltas.length;
			averageDelta.y /= deltas.length;

			this.yaw += toRad(averageDelta.x) * this.rotationSpeed;
			this.pitch += toRad(averageDelta.y) * this.rotationSpeed;
		}

		if(deltas.length == 1) {
			this.cachedMoveEvent = new Vec2(movementSum.x / touches, movementSum.y / touches)
		}
	}

	private move(x: number, y: number) {
		const v = Vec2.multiplyScalar(new Vec2(x, y), this.movementSpeed);

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

	public update(camera: Camera) {
		this.camera = camera;

		const tile = meters2tile(this.target.x, this.target.z);
		const tilePosition = new Vec2(Math.floor(tile.x), Math.floor(tile.y));

		if(HeightProvider.getTile(tilePosition.x, tilePosition.y)) {
			this.target.y = HeightProvider.getHeight(tilePosition.x, tilePosition.y, tile.x % 1, tile.y % 1);
		}

		this.distance = lerp(this.distance, this.distanceTarget, 0.4);
		if(Math.abs(this.distance - this.distanceTarget) < 0.01) {
			this.distance = this.distanceTarget;
		}

		this.pitch = clamp(this.pitch, toRad(0.01), toRad(89.99));
		this.yaw = normalizeAngle(this.yaw);

		this.direction = Vec3.normalize(sphericalToCartesian(this.yaw, -this.pitch));

		const cameraOffset = Vec3.multiplyScalar(this.direction, this.distance);
		const cameraPosition = Vec3.add(this.target, cameraOffset);

		camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
		camera.lookAt(this.target, false);

		if(this.cachedMoveEvent && this.mouseDownPosition) {
			this.camera.updateMatrixWorld();

			const positionOnGround = this.projectOnGround(this.cachedMoveEvent.x, this.cachedMoveEvent.y);
			const movementDelta = Vec2.sub(this.mouseDownPosition, positionOnGround);

			this.move(movementDelta.x, movementDelta.y);

			const cameraOffset = Vec3.multiplyScalar(this.direction, this.distance);
			const cameraPosition = Vec3.add(this.target, cameraOffset);

			camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
			camera.lookAt(this.target, false);
		}

		camera.updateMatrixWorld();
		camera.updateMatrixWorldInverse();
	}
}
