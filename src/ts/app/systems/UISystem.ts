import System from "../System";
import SystemManager from "../SystemManager";
import MathUtils from "../../math/MathUtils";
import UI from "../ui/UI";

export interface UIGlobalState {
	activeFeatureType: number;
	activeFeatureId: number;
	fps: number;
	frameTime: number;
}

const FPSUpdateInterval = 0.4;

export default class UISystem extends System {
	private globalState: UIGlobalState = {
		activeFeatureType: null,
		activeFeatureId: null,
		fps: 0,
		frameTime: 0
	};
	private fpsUpdateTimer = 0;

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();
	}

	private init(): void {
		document.getElementById('ui').addEventListener('click', event => {
			event.stopPropagation();
		});

		this.updateDOM();
	}

	public postInit(): void {

	}

	private updateDOM(): void {
		UI.update(this.globalState);
	}

	public setActiveFeature(type: number, id: number): void {
		this.globalState.activeFeatureId = id;
		this.globalState.activeFeatureType = type;
		this.updateDOM();
	}

	public clearActiveFeature(): void {
		this.globalState.activeFeatureId = null;
		this.globalState.activeFeatureType = null;
		this.updateDOM();
	}

	public updateFrameTime(frameTime: number): void {
		this.globalState.frameTime = MathUtils.lerp(this.globalState.frameTime, frameTime, 0.1);
	}

	public update(deltaTime: number): void {
		const newFps = Math.min(Math.round(1 / deltaTime), 1e3);
		this.globalState.fps = MathUtils.lerp(this.globalState.fps, newFps, 0.1);

		if(this.fpsUpdateTimer >= FPSUpdateInterval) {
			this.fpsUpdateTimer = 0;
			this.updateDOM();
		}

		this.fpsUpdateTimer += deltaTime;
	}
}