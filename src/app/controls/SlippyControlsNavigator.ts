import ControlsNavigator from "./ControlsNavigator";
import Vec2 from "~/lib/math/Vec2";
import CursorStyleSystem from "../systems/CursorStyleSystem";
import {ControlsState} from "../systems/ControlsSystem";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";

export default class SlippyControlsNavigator extends ControlsNavigator {
	public readonly camera: PerspectiveCamera;
	private readonly cursorStyleSystem: CursorStyleSystem;
	public height: number = 1;
	private position: Vec2 = new Vec2(0, 0);
	private isPointerDown: boolean = false;

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
		this.isPointerDown = true;
	}

	private mouseLeaveEvent(e: MouseEvent): void {
		this.isPointerDown = false;
	}

	private mouseUpEvent(e: MouseEvent): void {
		this.isPointerDown = false;
	}

	private mouseMoveEvent(e: MouseEvent): void {
		if (!this.isPointerDown) {
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

		const oldDistance = this.height;

		const logSpaceHeight = Math.log2(this.height);
		const newLogSpaceHeight = logSpaceHeight + e.deltaY * 0.001;

		const newDistance = MathUtils.clamp(
			2 ** newLogSpaceHeight,
			Config.MaxCameraDistance,
			this.getMaxHeight()
		);

		const getWorldPos = (x: number, y: number, distance: number): Vec2 => {
			const projectionHeight = Math.tan(MathUtils.toRad(this.camera.fov / 2)) * distance * 2;
			const projectionWidth = projectionHeight * this.camera.aspect;

			return new Vec2(
				this.position.y + projectionHeight * y,
				this.position.x + projectionWidth * x
			);
		}

		const pointerX = e.clientX / window.innerWidth - 0.5;
		const pointerY = 1 - e.clientY / window.innerHeight - 0.5;

		const posOld = getWorldPos(pointerX, pointerY, oldDistance);
		const posNew = getWorldPos(pointerX, pointerY, newDistance);

		this.position.x += posOld.x - posNew.x;
		this.position.y += posOld.y - posNew.y;

		this.height = newDistance;
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

	public syncWithCamera(): void {
		this.position.set(this.camera.position.x, this.camera.position.z);
		this.height = this.getMaxHeight();
		this.camera.near = 1000;
		this.camera.far = 40075016 * 10;
		this.camera.updateProjectionMatrix();
	}

	public syncWithState(state: ControlsState): void {

	}

	public getCurrentState(): ControlsState {
		return {
			x: this.position.x,
			z: this.position.y,
			pitch: 0,
			yaw: 0,
			distance: this.height
		};
	}

	public update(deltaTime: number): void {
		this.camera.position.x = this.position.x;
		this.camera.position.y = this.height;
		this.camera.position.z = this.position.y;

		this.camera.rotation.x = -Math.PI / 2;
		this.camera.rotation.z = -Math.PI / 2;

		//const viewportHeight = 1 / (2 ** this.zoom);
		//const viewportWidth = viewportHeight * (window.innerWidth / window.innerHeight);

		this.camera.updateProjectionMatrix();
		this.camera.updateMatrix();
		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}
}