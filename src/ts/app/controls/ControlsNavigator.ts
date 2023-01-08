import Camera from "~/core/Camera";
import {ControlsState} from "~/app/systems/ControlsSystem";

export default abstract class ControlsNavigator {
	protected readonly element: HTMLElement;
	protected camera: Camera;
	protected isEnabled: boolean = false;

	protected constructor(element: HTMLElement, camera: Camera) {
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
		return !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement);
	}

	protected abstract syncWithCamera(): void;
	public abstract syncWithState(state: ControlsState): void;
	public abstract getCurrentState(): ControlsState;
	public abstract update(deltaTime: number): void;
}