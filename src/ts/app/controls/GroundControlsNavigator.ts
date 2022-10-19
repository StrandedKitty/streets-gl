import ControlsNavigator from "~/app/controls/ControlsNavigator";
import Camera from "~/core/Camera";
import Vec2 from "~/math/Vec2";
import Vec3 from "~/math/Vec3";
import Config from "~/app/Config";
import MathUtils from "~/math/MathUtils";
import HeightProvider from "~/app/world/HeightProvider";
import CursorStyleSystem from "~/app/systems/CursorStyleSystem";
import {ControlsState} from "~/app/systems/ControlsSystem";

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

	public constructor(element: HTMLElement, camera: Camera, cursorStyleSystem: CursorStyleSystem) {
		super(element, camera);

		this.cursorStyleSystem = cursorStyleSystem;

		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseleave', (e: MouseEvent) => this.mouseLeaveEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));
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

	public disable(): void {
		super.disable();
		this.cursorStyleSystem.disableGrabbing();
		this.LMBDownPosition = null;
		this.lastLMBMoveEvent = null;
	}

	public update(deltaTime: number): void {
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