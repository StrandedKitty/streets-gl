import Config from "../Config";
import System from "../System";
import SystemManager from "../SystemManager";

enum CursorStyle {
	Default = 'default',
	Grab = 'grab',
	Grabbing = 'grabbing',
	Pointer = 'pointer'
}

export default class CursorStyleSystem extends System {
	private element: HTMLElement;
	private grabbingEnabled: boolean = false;
	private pointerEnabled: boolean = false;

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.element = <HTMLCanvasElement>document.getElementById('canvas');
	}

	public postInit() {

	}

	public enableGrabbing() {
		this.grabbingEnabled = true;
		this.updateStyle();
	}

	public disableGrabbing() {
		this.grabbingEnabled = false;
		this.updateStyle();
	}

	public enablePointer() {
		this.pointerEnabled = true;
		this.updateStyle();
	}

	public disablePointer() {
		this.pointerEnabled = false;
		this.updateStyle();
	}

	private updateStyle() {
		if(Config.IsMobileBrowser) {
			return;
		}

		if (this.pointerEnabled) {
			this.element.style.cursor = CursorStyle.Pointer;
			return;
		}

		if (this.grabbingEnabled) {
			this.element.style.cursor = CursorStyle.Grabbing;
			return;
		}

		this.element.style.cursor = CursorStyle.Grab;
	}

	public update(deltaTime: number) {

	}
}