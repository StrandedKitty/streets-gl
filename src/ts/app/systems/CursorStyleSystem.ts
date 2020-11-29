enum CursorStyle {
	Default = 'default',
	Grab = 'grab',
	Grabbing = 'grabbing',
	Pointer = 'pointer'
}

export default class CursorStyleSystem {
	private element: HTMLElement;
	private grabbingEnabled: boolean = false;
	private pointerEnabled: boolean = false;

	constructor(element: HTMLElement) {
		this.element = element;
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
}