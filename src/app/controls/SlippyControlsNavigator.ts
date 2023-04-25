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

		//const viewportWidth = 1 / (2 ** this.zoom) / window.innerHeight;

		this.position.x -= (e.movementX / window.innerHeight) * this.height;
		this.position.y -= (e.movementY / window.innerHeight) * this.height;
	}

	private wheelEvent(e: WheelEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		/*const oldZoom = this.zoom;
		const newZoom = MathUtils.clamp(
			this.zoom - e.deltaY * Config.SlippyMapZoomFactor,
			Config.SlippyMapMinZoom,
			Config.SlippyMapMaxZoom
		);

		const getWorldPos = (x: number, y: number, zoom: number): Vec2 => {
			return new Vec2(
				x * (1 / (2 ** zoom)) + this.position.x,
				y * (1 / (2 ** zoom)) + this.position.y
			);
		}

		const aspectRatio = window.innerWidth / window.innerHeight;
		const pointerX = (e.clientX / window.innerWidth - 0.5) * aspectRatio;
		const pointerY = 1 - e.clientY / window.innerHeight - 0.5;

		const posOld = getWorldPos(pointerX, pointerY, oldZoom);
		const posNew = getWorldPos(pointerX, pointerY, newZoom);

		this.position.x += posOld.x - posNew.x;
		this.position.y += posOld.y - posNew.y;*/

		const logSpaceHeight = Math.log2(this.height);
		const newLogSpaceHeight = logSpaceHeight + e.deltaY * 0.001;
		this.height = 2 ** newLogSpaceHeight;

		this.height = MathUtils.clamp(this.height, Config.MaxCameraDistance, this.getMaxHeight());
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
			distance: 1000
		};
	}

	public update(deltaTime: number): void {
		this.camera.position.x = this.position.x;
		this.camera.position.y = this.height;
		this.camera.position.z = this.position.y;

		this.camera.rotation.x = -Math.PI / 2;

		//const viewportHeight = 1 / (2 ** this.zoom);
		//const viewportWidth = viewportHeight * (window.innerWidth / window.innerHeight);

		this.camera.updateProjectionMatrix();
		this.camera.updateMatrix();
		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}
}