import ControlsNavigator from "./ControlsNavigator";
import Camera from "~/lib/core/Camera";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import Config from "../Config";
import MathUtils from "~/lib/math/MathUtils";
import HeightProvider from "../world/HeightProvider";
import CursorStyleSystem from "../systems/CursorStyleSystem";
import {ControlsState} from "../systems/ControlsSystem";

export default class GroundControlsNavigator extends ControlsNavigator {
	private readonly cursorStyleSystem: CursorStyleSystem;
	public target: Vec3 = new Vec3();
	private direction: Vec3 = new Vec3();
	private normalizedDistance: number = 10;
	private normalizedDistanceTarget: number = 10;
	private distance: number = 0;
	private pitch: number = MathUtils.toRad(45);
	private yaw: number = MathUtils.toRad(0);
	private isLMBDown: boolean = false;
	private isRMBDown: boolean = false;
	private LMBDownPosition: Vec2 = null;
	private lastLMBMoveEvent: Vec2 = null;
	private forwardKeyPressed: boolean = false;
	private leftKeyPressed: boolean = false;
	private rightKeyPressed: boolean = false;
	private backwardKeyPressed: boolean = false;
	private fastMovementKeyPressed: boolean = false;
	private pitchMinusKeyPressed: boolean = false;
	private pitchPlusKeyPressed: boolean = false;
	private yawMinusKeyPressed: boolean = false;
	private yawPlusKeyPressed: boolean = false;

	public constructor(element: HTMLElement, camera: Camera, cursorStyleSystem: CursorStyleSystem) {
		super(element, camera);

		this.cursorStyleSystem = cursorStyleSystem;

		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseleave', (e: MouseEvent) => this.mouseLeaveEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));
		document.addEventListener('keydown', (e: KeyboardEvent) => this.keyDownEvent(e));
		document.addEventListener('keyup', (e: KeyboardEvent) => this.keyUpEvent(e));
	}

	private mouseDownEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		switch (e.button) {
			case 0: {
				this.isLMBDown = true;
				this.LMBDownPosition = this.projectOnGround(e.clientX, e.clientY);
				break;
			}
			case 2: {
				this.isRMBDown = true;
				break;
			}
		}
	}

	private mouseLeaveEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		this.cursorStyleSystem.disableGrabbing();

		this.isRMBDown = false;
		this.isLMBDown = false;
		this.LMBDownPosition = null;
		this.lastLMBMoveEvent = null;
	}

	private mouseUpEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		this.cursorStyleSystem.disableGrabbing();

		switch (e.button) {
			case 0: {
				this.isLMBDown = false;
				this.LMBDownPosition = null;
				this.lastLMBMoveEvent = null;
				break;
			}
			case 2: {
				this.isRMBDown = false;
				break;
			}
		}
	}

	private mouseMoveEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		if (this.isRMBDown || this.isLMBDown) {
			this.cursorStyleSystem.enableGrabbing();
		}

		if (this.isRMBDown) {
			this.yaw += MathUtils.toRad(e.movementX) * 0.25;
			this.pitch += MathUtils.toRad(e.movementY) * 0.25;
		}

		if (this.isLMBDown) {
			this.lastLMBMoveEvent = new Vec2(e.clientX, e.clientY);
		}
	}

	private wheelEvent(e: WheelEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		if (e.ctrlKey) {
			this.normalizedDistanceTarget += e.deltaY / 200.;
			return;
		}

		this.normalizedDistanceTarget += e.deltaY / 2000.;
	}

	private keyDownEvent(e: KeyboardEvent): void {
		if (!this.isEnabled || !this.isInFocus) {
			return;
		}

		switch (e.code) {
			case 'KeyW':
				this.forwardKeyPressed = true;
				break;
			case 'KeyA':
				this.leftKeyPressed = true;
				break;
			case 'KeyS':
				this.backwardKeyPressed = true;
				break;
			case 'ShiftLeft':
				this.fastMovementKeyPressed = true;
				break;
			case 'KeyD':
				this.rightKeyPressed = true;
				break;
			case 'KeyQ':
				this.yawPlusKeyPressed = true;
				break;
			case 'KeyE':
				this.yawMinusKeyPressed = true;
				break;
			case 'KeyR':
				this.pitchPlusKeyPressed = true;
				break;
			case 'KeyF':
				this.pitchMinusKeyPressed = true;
				break;
		}
	}

	private keyUpEvent(e: KeyboardEvent): void {
		if (!this.isEnabled) {
			return;
		}

		switch (e.code) {
			case 'KeyW':
				this.forwardKeyPressed = false;
				break;
			case 'KeyA':
				this.leftKeyPressed = false;
				break;
			case 'KeyS':
				this.backwardKeyPressed = false;
				break;
			case 'ShiftLeft':
				this.fastMovementKeyPressed = false;
				break;
			case 'KeyD':
				this.rightKeyPressed = false;
				break;
			case 'KeyQ':
				this.yawPlusKeyPressed = false;
				break;
			case 'KeyE':
				this.yawMinusKeyPressed = false;
				break;
			case 'KeyR':
				this.pitchPlusKeyPressed = false;
				break;
			case 'KeyF':
				this.pitchMinusKeyPressed = false;
				break;
		}
	}

	private moveTarget(dx: number, dy: number): void {
		const v = new Vec2(dx, dy);
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

	private clampPitchAndYaw(): void {
		this.pitch = MathUtils.clamp(
			this.pitch,
			MathUtils.toRad(Config.MinCameraPitch),
			MathUtils.toRad(Config.MaxCameraPitch)
		);
		this.yaw = MathUtils.normalizeAngle(this.yaw);
	}

	private updateTargetHeightFromHeightmap(): void {
		const tileSpacePosition = MathUtils.meters2tile(this.target.x, this.target.z);
		const tilePosition = new Vec2(Math.floor(tileSpacePosition.x), Math.floor(tileSpacePosition.y));

		if (HeightProvider.getTile(tilePosition.x, tilePosition.y)) {
			this.target.y = HeightProvider.getHeight(tilePosition.x, tilePosition.y, tileSpacePosition.x % 1, tileSpacePosition.y % 1);
		}
	}

	public syncWithCamera(): void {
		const mat = this.camera.matrixWorld.values;
		const forwardDir = Vec3.normalize(new Vec3(mat[8], mat[9], mat[10]));
		const [pitch, yaw] = MathUtils.cartesianToPolar(forwardDir);

		this.pitch = pitch;
		this.yaw = yaw;
		this.normalizedDistance = this.normalizedDistanceTarget = 10;
		this.target.set(this.camera.position.x, 0, this.camera.position.z);
		this.updateTargetHeightFromHeightmap();
	}

	public syncWithState(state: ControlsState): void {
		this.target.x = state.x;
		this.target.z = state.z;
		this.pitch = state.pitch;
		this.yaw = state.yaw;
		this.normalizedDistance = this.normalizedDistanceTarget = Math.log2(state.distance);
	}

	public getCurrentState(): ControlsState {
		return {
			x: this.target.x,
			z: this.target.z,
			pitch: this.pitch,
			yaw: this.yaw,
			distance: 2 ** this.normalizedDistance
		};
	}

	public override disable(): void {
		super.disable();
		this.cursorStyleSystem.disableGrabbing();
		this.LMBDownPosition = null;
		this.lastLMBMoveEvent = null;
	}

	private processMovementByKeys(deltaTime: number): void {
		const mat = this.camera.matrixWorld.values;
		const forwardDir = Vec2.normalize(new Vec2(mat[8], mat[10]));
		const rightDir = Vec2.normalize(new Vec2(mat[0], mat[2]));
		const speed = this.fastMovementKeyPressed ? Config.GroundCameraSpeedFast : Config.GroundCameraSpeed;

		let movementDelta = new Vec2();
		if (this.forwardKeyPressed) {
			movementDelta = Vec2.add(movementDelta, Vec2.multiplyScalar(forwardDir, -deltaTime));
		}
		if (this.backwardKeyPressed) {
			movementDelta = Vec2.add(movementDelta, Vec2.multiplyScalar(forwardDir, deltaTime));
		}
		if (this.leftKeyPressed) {
			movementDelta = Vec2.add(movementDelta, Vec2.multiplyScalar(rightDir, -deltaTime));
		}
		if (this.rightKeyPressed) {
			movementDelta = Vec2.add(movementDelta, Vec2.multiplyScalar(rightDir, deltaTime));
		}
		movementDelta = Vec2.multiplyScalar(movementDelta, speed);

		this.target.x += movementDelta.x;
		this.target.z += movementDelta.y;

		if (this.yawPlusKeyPressed) {
			this.yaw += deltaTime * Config.FreeCameraYawSpeed;
		}
		if (this.yawMinusKeyPressed) {
			this.yaw -= deltaTime * Config.FreeCameraYawSpeed;
		}
		if (this.pitchMinusKeyPressed) {
			this.pitch -= deltaTime * Config.FreeCameraPitchSpeed;
		}
		if (this.pitchPlusKeyPressed) {
			this.pitch += deltaTime * Config.FreeCameraPitchSpeed;
		}
	}

	public update(deltaTime: number): void {
		this.processMovementByKeys(deltaTime);
		this.updateDistance();
		this.clampPitchAndYaw();
		this.updateTargetHeightFromHeightmap();

		this.direction = Vec3.normalize(MathUtils.polarToCartesian(this.yaw, -this.pitch));

		const cameraOffset = Vec3.multiplyScalar(this.direction, -this.distance);
		const cameraPosition = Vec3.add(this.target, cameraOffset);

		this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
		this.camera.lookAt(this.target, false);

		if (this.lastLMBMoveEvent && this.LMBDownPosition) {
			this.camera.updateMatrixWorld();

			const positionOnGround = this.projectOnGround(this.lastLMBMoveEvent.x, this.lastLMBMoveEvent.y);
			const movementDelta = Vec2.sub(this.LMBDownPosition, positionOnGround);

			this.moveTarget(movementDelta.x, movementDelta.y);

			const cameraOffset = Vec3.multiplyScalar(this.direction, -this.distance);
			const cameraPosition = Vec3.add(this.target, cameraOffset);

			this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
			this.camera.lookAt(this.target, false);
		}

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}
}