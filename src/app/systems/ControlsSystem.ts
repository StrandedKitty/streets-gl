import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import URLControlsStateHandler from "../controls/URLControlsStateHandler";
import Config from "../Config";
import System from "../System";
import SceneSystem from './SceneSystem';
import Easing from "~/lib/math/Easing";
import GroundControlsNavigator from "../controls/GroundControlsNavigator";
import ControlsNavigator from "../controls/ControlsNavigator";
import FreeControlsNavigator from "../controls/FreeControlsNavigator";
import CursorStyleSystem from "./CursorStyleSystem";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import TerrainSystem from "~/app/systems/TerrainSystem";
import SlippyControlsNavigator from "~/app/controls/SlippyControlsNavigator";

const WheelZoomFactor = 6;

export interface ControlsState {
	x: number;
	z: number;
	pitch: number;
	yaw: number;
	distance: number;
}

export enum NavigationMode {
	Ground,
	Free,
	Slippy
}

export default class ControlsSystem extends System {
	private readonly element: HTMLElement;
	public mode: NavigationMode = NavigationMode.Ground;
	private camera: PerspectiveCamera;
	private tick: number = 0;
	public target: Vec3 = new Vec3();
	private state: ControlsState;
	private urlHandler: URLControlsStateHandler = new URLControlsStateHandler();
	private wheelZoomScale: number = 0;
	private wheelZoomScaleTarget: number = 0;

	private groundNavigator: GroundControlsNavigator;
	private freeNavigator: FreeControlsNavigator;
	private slippyNavigator: SlippyControlsNavigator;
	private activeNavigator: ControlsNavigator = null;

	public constructor() {
		super();

		this.element = <HTMLCanvasElement>document.getElementById('canvas');

		this.element.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		window.addEventListener('keydown', (e: KeyboardEvent) => this.keyDownEvent(e));
	}

	public postInit(): void {

	}

	public lookAtNorth(): void {
		if (this.activeNavigator) {
			this.activeNavigator.lookAtNorth();
		}
	}

	private initCameraAndNavigators(): void {
		this.camera = this.systemManager.getSystem(SceneSystem).objects.camera;

		const cursorStyleSystem = this.systemManager.getSystem(CursorStyleSystem);
		const terrainHeightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;

		this.groundNavigator = new GroundControlsNavigator(this.element, this.camera, cursorStyleSystem, terrainHeightProvider);
		this.freeNavigator = new FreeControlsNavigator(this.element, this.camera, terrainHeightProvider);
		this.slippyNavigator = new SlippyControlsNavigator(this.element, this.camera, cursorStyleSystem);

		this.activeNavigator = this.slippyNavigator;
		this.slippyNavigator.enable();
		this.slippyNavigator.syncWithCamera(null);
		this.mode = NavigationMode.Slippy;

		this.initStateFromHash();
	}

	private initStateFromHash(): void {
		const [newState] = this.urlHandler.getStateFromHash();

		if (newState) {
			this.state = newState;
			this.updatePositionFromState(this.state);
		} else {
			const startPosition = MathUtils.degrees2meters(Config.StartPosition[0], Config.StartPosition[1]);

			this.state = {
				x: startPosition.x,
				z: startPosition.y,
				pitch: MathUtils.toRad(45),
				yaw: MathUtils.toRad(0),
				distance: 2 ** 10
			}

			this.updatePositionFromState(this.state);
		}
	}

	public getLatLon(): {lat: number; lon: number} {
		return MathUtils.meters2degrees(this.camera.position.x, this.camera.position.z);
	}

	public setLatLon(lat: number, lon: number): void {
		const position = MathUtils.degrees2meters(lat, lon);

		this.state.x = position.x;
		this.state.z = position.y;

		this.updatePositionFromState(this.state);
	}

	private updateStateFromPosition(): void {
		if (this.activeNavigator) {
			this.state = this.activeNavigator.getCurrentState();
		}
	}

	private updatePositionFromState(state: ControlsState): void {
		if (this.activeNavigator) {
			this.activeNavigator.syncWithState(state);
		}
	}

	private keyDownEvent(e: KeyboardEvent): void {
		if (e.code === 'Tab') {
			e.preventDefault();

			this.mode = this.mode === NavigationMode.Ground ? NavigationMode.Free : NavigationMode.Ground;

			if (this.mode === NavigationMode.Ground) {
				this.activeNavigator = this.groundNavigator;
				this.freeNavigator.disable();
				this.groundNavigator.enable();
				this.groundNavigator.syncWithCamera(this.freeNavigator);
			} else {
				this.activeNavigator = this.freeNavigator;
				this.groundNavigator.disable();
				this.freeNavigator.enable();
				this.freeNavigator.syncWithCamera(this.groundNavigator);
			}
		}
	}

	private mouseDownEvent(e: MouseEvent): void {
		e.preventDefault();

		if (e.button === 1) {
			this.wheelZoomScaleTarget = 1;
		}
	}

	private mouseUpEvent(e: MouseEvent): void {
		if (e.button === 1) {
			this.wheelZoomScaleTarget = 0;
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

	public getCurrentStateHash(): string {
		return this.urlHandler.serializeControlsState(this.state);
	}

	public get drawSlippyMap(): boolean {
		return this.slippyNavigator.isEnabled;
	}

	public update(deltaTime: number): void {
		if (!this.camera) {
			this.initCameraAndNavigators();
		}

		if (this.groundNavigator.distance === Config.MaxCameraDistance && this.groundNavigator.isEnabled) {
			this.groundNavigator.disable();
			this.slippyNavigator.enable();
			this.slippyNavigator.syncWithCamera(this.groundNavigator);

			this.activeNavigator = this.slippyNavigator;
			this.mode = NavigationMode.Slippy;
		}

		if (this.slippyNavigator.distance === Config.MaxCameraDistance && this.slippyNavigator.isEnabled) {
			this.slippyNavigator.disable();
			this.groundNavigator.enable();
			this.groundNavigator.syncWithCamera(this.slippyNavigator);

			this.activeNavigator = this.groundNavigator;
			this.mode = NavigationMode.Ground;
		}

		if (this.activeNavigator) {
			this.activeNavigator.update(deltaTime);
		}

		if (this.wheelZoomScaleTarget !== this.wheelZoomScale) {
			const sign = Math.sign(this.wheelZoomScaleTarget - this.wheelZoomScale);

			this.wheelZoomScale += sign * deltaTime * WheelZoomFactor;
			this.wheelZoomScale = MathUtils.clamp(this.wheelZoomScale, 0, 1);

			const alpha = Easing.easeOutCubic(this.wheelZoomScale);

			this.camera.zoom(MathUtils.lerp(1, Config.CameraFOVZoomFactor, alpha));
		}

		this.updateHash();

		++this.tick;
	}
}
