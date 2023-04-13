import {ControlsState} from "../systems/ControlsSystem";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";

export default abstract class ControlsNavigator {
	protected readonly element: HTMLElement;
	protected camera: PerspectiveCamera;
	protected isEnabled: boolean = false;

	protected constructor(element: HTMLElement, camera: PerspectiveCamera) {
		this.element = element;
		this.camera = camera;
	}

	public enable(): void {
		this.syncWithCamera();
		this.isEnabled = true;
	}

	public disable(): void {
		this.isEnabled = false;
	}

	protected get isInFocus(): boolean {
		return !(
			document.activeElement instanceof HTMLInputElement
			|| document.activeElement instanceof HTMLTextAreaElement
			|| document.activeElement.attributes.getNamedItem('contenteditable') !== null
		);
	}

	protected abstract syncWithCamera(): void;

	public abstract syncWithState(state: ControlsState): void;

	public abstract getCurrentState(): ControlsState;

	public abstract lookAtNorth(): void;

	public abstract update(deltaTime: number): void;
}