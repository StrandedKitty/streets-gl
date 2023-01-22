import System from "../System";
import SystemManager from "../SystemManager";
import MathUtils from "~/lib/math/MathUtils";
import UI from "../ui/UI";
import RenderSystem from "./RenderSystem";
import * as RG from "~/lib/render-graph";
import ControlsSystem from "./ControlsSystem";
import MapTimeSystem from "./MapTimeSystem";

export interface RenderGraphSnapshot {
	graph: {
		type: 'resource' | 'pass';
		name: string;
		metadata: Record<string, string>;
		localResources?: Record<string, string>[];
		prev: string[];
		next: string[];
	}[];
	passOrder: string[];
}

export interface UIGlobalState {
	activeFeatureType: number;
	activeFeatureId: number;
	fps: number;
	fpsSmooth: number;
	frameTime: number;
	mapTime: number;
	mapTimeMultiplier: number;
	renderGraph: RenderGraphSnapshot;
	resourcesLoaded: boolean;
	resourcesLoadingProgress: number;
}

const FPSUpdateInterval = 0.4;

export default class UISystem extends System {
	private globalState: UIGlobalState = {
		activeFeatureType: null,
		activeFeatureId: null,
		fps: 0,
		fpsSmooth: 0,
		frameTime: 0,
		mapTime: Date.now(),
		mapTimeMultiplier: 1,
		renderGraph: null,
		resourcesLoaded: false,
		resourcesLoadingProgress: 0
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

		UI.setInitialGlobalState(this.globalState);
		this.updateDOM();
	}

	public postInit(): void {

	}

	private updateDOM(): void {
		UI.update(
			() => this.updateRenderGraph(),
			(lat: number, lon: number): void => {
				this.systemManager.getSystem(ControlsSystem).setLatLon(lat, lon);
			},
			(state: number): void => {
				this.systemManager.getSystem(MapTimeSystem).setState(state);
			}
		);
	}

	public setResourcesLoadingProgress(progress: number): void {
		UI.setGlobalStateField('resourcesLoaded', progress === 1);
		UI.setGlobalStateField('resourcesLoadingProgress', progress);
	}

	public setActiveFeature(type: number, id: number): void {
		console.log(`feature ${type} ${id}`);

		UI.setGlobalStateField('activeFeatureId', id);
		UI.setGlobalStateField('activeFeatureType', type);
	}

	public clearActiveFeature(): void {
		UI.setGlobalStateField('activeFeatureId', null);
		UI.setGlobalStateField('activeFeatureType', null);
	}

	public updateFrameTime(frameTime: number): void {
		const value = MathUtils.lerp(this.globalState.frameTime, frameTime, 0.1);
		UI.setGlobalStateField('frameTime', value);
	}

	public get mapTime(): number {
		return this.globalState.mapTime;
	}

	private getRenderGraph(): RenderGraphSnapshot {
		const renderSystem = this.systemManager.getSystem(RenderSystem);
		const sourceGraph = renderSystem.getLastRenderGraph();
		const sourcePassList = renderSystem.getLastRenderGraphPassList();

		if (!sourceGraph || !sourcePassList) {
			return null;
		}

		const {indegree, outdegree} = renderSystem.getRenderGraphNodeConnectionSets();

		return <RenderGraphSnapshot>{
			graph: Array.from(sourceGraph).map(node => {
				const prev = Array.from(indegree.get(node)).map(n => n.name);
				const next = Array.from(outdegree.get(node)).map(n => n.name);
				const metadata: Record<string, string> = {};
				let localResources: Record<string, string>[] = null;
				let type: string = '';

				if (node instanceof RG.Pass) {
					type = 'pass';
					metadata.index = sourcePassList.indexOf(node).toString();
					const localResourcesSet = node.getAllResourcesOfType(RG.InternalResourceType.Local);
					localResources = Array.from(localResourcesSet).map(r => ({
						name: r.name,
						isTransient: r.isTransient.toString(),
						isUsedExternally: r.isUsedExternally.toString()
					}));
				} else if (node instanceof RG.Resource) {
					type = 'resource';
					metadata.isTransient = node.isTransient.toString();
					metadata.isUsedExternally = node.isUsedExternally.toString();
				}

				return {
					type,
					name: node.name,
					prev,
					next,
					metadata,
					localResources
				};
			}),
			passOrder: sourcePassList.map(p => p.name)
		}
	}

	public updateRenderGraph(): void {
		UI.setGlobalStateField('renderGraph', this.getRenderGraph());
	}

	public update(deltaTime: number): void {
		const newFps = Math.min(Math.round(1 / deltaTime), 1e3);
		UI.setGlobalStateField('fps', MathUtils.lerp(this.globalState.fps, newFps, 0.1));

		if (this.fpsUpdateTimer >= FPSUpdateInterval) {
			this.fpsUpdateTimer = 0;
			UI.setGlobalStateField('fpsSmooth', this.globalState.fps);
		}

		this.fpsUpdateTimer += deltaTime;

		const newMapTime = this.globalState.mapTime + deltaTime * 1000 * this.globalState.mapTimeMultiplier;
		UI.setGlobalStateField('mapTime', newMapTime);
	}
}