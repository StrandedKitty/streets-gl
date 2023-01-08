import ControlsNavigator from "~/app/controls/ControlsNavigator";
import Camera from "~/core/Camera";
import Vec2 from "~/math/Vec2";
import Vec3 from "~/math/Vec3";
import Config from "~/app/Config";
import MathUtils from "~/math/MathUtils";
import HeightProvider from "~/app/world/HeightProvider";
import {ControlsState} from "~/app/systems/ControlsSystem";

export default class FreeControlsNavigator extends ControlsNavigator {
	private pitch: number = MathUtils.toRad(45);
	private yaw: number = MathUtils.toRad(0);
	private forwardKeyPressed: boolean = false;
	private leftKeyPressed: boolean = false;
	private rightKeyPressed: boolean = false;
	private backwardKeyPressed: boolean = false;
	private fastMovementKeyPressed: boolean = false;
	private pitchMinusKeyPressed: boolean = false;
	private pitchPlusKeyPressed: boolean = false;
	private yawMinusKeyPressed: boolean = false;
	private yawPlusKeyPressed: boolean = false;
	private pointerLocked: boolean = false;

	public constructor(element: HTMLElement, camera: Camera) {
		super(element, camera);

		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		document.addEventListener('keydown', (e: KeyboardEvent) => this.keyDownEvent(e));
		document.addEventListener('keyup', (e: KeyboardEvent) => this.keyUpEvent(e));
		document.addEventListener('pointerlockchange', () => this.pointerLockChange());
	}

	private pointerLockChange(): void {
		this.pointerLocked = document.pointerLockElement === this.element;
	}

	private mouseDownEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		if (e.button === 0 || e.button === 2) {
			this.element.requestPointerLock();
		}
	}

	private mouseMoveEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		if (this.pointerLocked) {
			this.yaw += e.movementX * Config.FreeCameraRotationSensitivity;
			this.pitch += e.movementY * Config.FreeCameraRotationSensitivity;
		}
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
			case 'KeyD':
				this.rightKeyPressed = true;
				break;
			case 'ShiftLeft':
				this.fastMovementKeyPressed = true;
				break;
			case 'KeyQ':
				this.yawMinusKeyPressed = true;
				break;
			case 'KeyE':
				this.yawPlusKeyPressed = true;
				break;
			case 'KeyR':
				this.pitchMinusKeyPressed = true;
				break;
			case 'KeyF':
				this.pitchPlusKeyPressed = true;
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
			case 'KeyD':
				this.rightKeyPressed = false;
				break;
			case 'ShiftLeft':
				this.fastMovementKeyPressed = false;
				break;
			case 'KeyQ':
				this.yawMinusKeyPressed = false;
				break;
			case 'KeyE':
				this.yawPlusKeyPressed = false;
				break;
			case 'KeyR':
				this.pitchMinusKeyPressed = false;
				break;
			case 'KeyF':
				this.pitchPlusKeyPressed = false;
				break;
		}
	}

	private getHeightmapValueAtPosition(x: number, y: number): number {
		const tileSpacePosition = MathUtils.meters2tile(x, y);
		const tilePosition = new Vec2(Math.floor(tileSpacePosition.x), Math.floor(tileSpacePosition.y));

		if (HeightProvider.getTile(tilePosition.x, tilePosition.y)) {
			return HeightProvider.getHeight(tilePosition.x, tilePosition.y, tileSpacePosition.x % 1, tileSpacePosition.y % 1);
		}

		return 0;
	}

	public syncWithCamera(): void {
		const mat = this.camera.matrixWorld.values;
		const forwardDir = Vec3.normalize(new Vec3(mat[8], mat[9], mat[10]));
		const [pitch, yaw] = MathUtils.cartesianToPolar(forwardDir);

		this.pitch = pitch;
		this.yaw = yaw;
	}

	private applyCameraPitchAndYaw(): void {
		const target = MathUtils.polarToCartesian(this.yaw, -this.pitch);
		target.x += this.camera.position.x;
		target.y += this.camera.position.y;
		target.z += this.camera.position.z;

		this.camera.lookAt(target);
	}

	private clampPitchAndYaw(): void {
		this.pitch = MathUtils.clamp(
			this.pitch,
			MathUtils.toRad(Config.MinFreeCameraPitch),
			MathUtils.toRad(Config.MaxFreeCameraPitch)
		);
		this.yaw = MathUtils.normalizeAngle(this.yaw);
	}

	public enable(): void {
		super.enable();
		this.element.requestPointerLock();
	}

	public disable(): void {
		super.disable();
		document.exitPointerLock();
		this.forwardKeyPressed = this.backwardKeyPressed = this.leftKeyPressed = this.rightKeyPressed = false;
	}

	public syncWithState(state: ControlsState): void {
		this.pitch = state.pitch;
		this.yaw = state.yaw;

		const target = MathUtils.polarToCartesian(this.yaw, -this.pitch);
		const height = this.getHeightmapValueAtPosition(state.x, state.z);

		this.camera.position.x = state.x - target.x * state.distance;
		this.camera.position.y = height - target.y * state.distance;
		this.camera.position.z = state.z - target.z * state.distance;
	}

	public getCurrentState(): ControlsState {
		return {
			x: this.camera.position.x,
			z: this.camera.position.z,
			pitch: this.pitch,
			yaw: this.yaw,
			distance: 1000
		};
	}

	public update(deltaTime: number): void {
		const mat = this.camera.matrixWorld.values;
		const forwardDir = Vec3.normalize(new Vec3(mat[8], mat[9], mat[10]));
		const rightDir = Vec3.normalize(new Vec3(mat[0], mat[1], mat[2]));
		const speed = this.fastMovementKeyPressed ? Config.FreeCameraSpeedFast : Config.FreeCameraSpeed;

		let movementDelta = new Vec3();
		if (this.forwardKeyPressed) {
			movementDelta = Vec3.add(movementDelta, Vec3.multiplyScalar(forwardDir, -deltaTime));
		}
		if (this.backwardKeyPressed) {
			movementDelta = Vec3.add(movementDelta, Vec3.multiplyScalar(forwardDir, deltaTime));
		}
		if (this.leftKeyPressed) {
			movementDelta = Vec3.add(movementDelta, Vec3.multiplyScalar(rightDir, -deltaTime));
		}
		if (this.rightKeyPressed) {
			movementDelta = Vec3.add(movementDelta, Vec3.multiplyScalar(rightDir, deltaTime));
		}
		movementDelta = Vec3.multiplyScalar(movementDelta, speed);

		this.camera.position.x += movementDelta.x;
		this.camera.position.y += movementDelta.y;
		this.camera.position.z += movementDelta.z;

		const heightmapValue = this.getHeightmapValueAtPosition(this.camera.position.x, this.camera.position.z);
		this.camera.position.y = Math.max(this.camera.position.y, heightmapValue + 15);

		this.camera.updateMatrix();

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

		this.clampPitchAndYaw();
		this.applyCameraPitchAndYaw();

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}
}