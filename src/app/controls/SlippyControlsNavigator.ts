import ControlsNavigator from "./ControlsNavigator";
import Vec2 from "~/lib/math/Vec2";
import CursorStyleSystem from "../systems/CursorStyleSystem";
import {ControlsState} from "../systems/ControlsSystem";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";
import GroundControlsNavigator from "~/app/controls/GroundControlsNavigator";

export default class SlippyControlsNavigator extends ControlsNavigator {
	public readonly camera: PerspectiveCamera;
	private readonly cursorStyleSystem: CursorStyleSystem;
	public distance: number = 1;
	private distanceTarget: number = 1;
	private position: Vec2 = new Vec2(0, 0);
	private isPointerDown: boolean = false;
	private pointerPosition: Vec2 = new Vec2(0, 0);

	public constructor(
		element: HTMLElement,
		camera: PerspectiveCamera,
		cursorStyleSystem: CursorStyleSystem
	) {
		super(element);

		this.camera = camera;
		this.cursorStyleSystem = cursorStyleSystem;

		this.addEventListeners();
	}

	private addEventListeners(): void {
		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('dblclick', (e: MouseEvent) => this.doubleClickEvent(e));
		this.element.addEventListener('mouseleave', (e: MouseEvent) => this.mouseLeaveEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));
		document.addEventListener('keydown', (e: KeyboardEvent) => this.keyDownEvent(e));
		document.addEventListener('keyup', (e: KeyboardEvent) => this.keyUpEvent(e));
	}

	public lookAtNorth(): void {

	}

	private mouseDownEvent(e: MouseEvent): void {
		e.preventDefault();

		if (e.button !== 0) {
			return;
		}

		this.isPointerDown = true;

		if (!this.isEnabled) {
			return;
		}

		this.cursorStyleSystem.enableGrabbing();
	}

	private doubleClickEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		const logSpaceDistance = Math.log2(this.distanceTarget);
		const newLogSpaceDistance = logSpaceDistance - 1.;

		this.distanceTarget = MathUtils.clamp(
			2 ** newLogSpaceDistance,
			0,
			this.getMaxHeight()
		);
	}

	private mouseLeaveEvent(e: MouseEvent): void {
		this.isPointerDown = false;

		if (!this.isEnabled) {
			return;
		}

		this.cursorStyleSystem.disableGrabbing();
	}

	private mouseUpEvent(e: MouseEvent): void {
		if (e.button !== 0) {
			return;
		}

		this.isPointerDown = false;

		if (!this.isEnabled) {
			return;
		}

		this.cursorStyleSystem.disableGrabbing();
	}

	private mouseMoveEvent(e: MouseEvent): void {
		const pointerX = e.clientX / window.innerWidth - 0.5;
		const pointerY = 1 - e.clientY / window.innerHeight - 0.5;

		this.pointerPosition.set(pointerX, pointerY);

		if (!this.isPointerDown || !this.isEnabled) {
			return;
		}

		const projectionHeight = Math.tan(MathUtils.toRad(this.camera.fov / 2)) * this.camera.position.y * 2;
		const projectionWidth = projectionHeight * this.camera.aspect;

		this.position.x += (e.movementY / window.innerHeight) * projectionHeight;
		this.position.y -= (e.movementX / window.innerWidth) * projectionWidth;
	}

	private wheelEvent(e: WheelEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		const zoomSpeed = Config.CameraZoomSpeed * (e.ctrlKey ? Config.CameraZoomTrackpadFactor : 1);
		const logSpaceDistance = Math.log2(this.distanceTarget);
		const newLogSpaceDistance = logSpaceDistance + e.deltaY * zoomSpeed;

		this.distanceTarget = MathUtils.clamp(
			2 ** newLogSpaceDistance,
			0,
			this.getMaxHeight()
		);
	}

	private updateDistance(deltaTime: number): void {
		const alpha = 1 - Math.pow(1 - 0.3, deltaTime / (1 / 60));

		const oldDistance = this.distance;
		let newDistance = MathUtils.lerp(oldDistance, this.distanceTarget, alpha);

		if (Math.abs(newDistance - this.distanceTarget) < 0.1) {
			newDistance = this.distanceTarget;
		}

		const getWorldPos = (x: number, y: number, distance: number): Vec2 => {
			const projectionHeight = Math.tan(MathUtils.toRad(this.camera.fov / 2)) * distance * 2;
			const projectionWidth = projectionHeight * this.camera.aspect;

			return new Vec2(
				this.position.y + projectionHeight * y,
				this.position.x + projectionWidth * x
			);
		}

		const pointer = this.pointerPosition;
		const posOld = getWorldPos(pointer.x, pointer.y, oldDistance);
		const posNew = getWorldPos(pointer.x, pointer.y, newDistance);

		this.position.x += posOld.x - posNew.x;
		this.position.y += posOld.y - posNew.y;

		this.distance = newDistance;
	}

	private getMaxHeight(): number {
		const mapSize = 40075016.68;
		const fov = MathUtils.toRad(this.camera.fov);

		return mapSize / Math.tan(fov / 2) * 0.5;
	}

	private keyDownEvent(e: KeyboardEvent): void {

	}

	private keyUpEvent(e: KeyboardEvent): void {

	}

	public syncWithCamera(prevNavigator: ControlsNavigator): void {
		if (prevNavigator instanceof GroundControlsNavigator) {
			this.position.set(this.camera.position.x, this.camera.position.z);
			this.distance = this.distanceTarget = prevNavigator.distance + 1;
		} else {
			this.position.set(this.camera.position.x, this.camera.position.z);
			this.distance = this.distanceTarget = this.getMaxHeight();
		}

		this.camera.near = 1000;
		this.camera.far = 40075016 * 10;
		this.camera.updateProjectionMatrix();
	}

	public syncWithState(state: ControlsState): void {
		this.position.set(state.x, state.z);
		this.distance = this.distanceTarget = 100000;
	}

	public getCurrentState(): ControlsState {
		return {
			x: this.position.x,
			z: this.position.y,
			pitch: 0,
			yaw: 0,
			distance: this.distance
		};
	}

	public update(deltaTime: number): void {
		this.updateDistance(deltaTime);

		this.camera.position.x = this.position.x;
		this.camera.position.y = this.distance;
		this.camera.position.z = this.position.y;

		this.camera.rotation.x = -Math.PI / 2;
		this.camera.rotation.z = -Math.PI / 2;

		this.camera.updateProjectionMatrix();
		this.camera.updateMatrix();
		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}
}