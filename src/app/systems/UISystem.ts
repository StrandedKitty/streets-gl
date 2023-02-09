import System from "../System";
import MathUtils from "~/lib/math/MathUtils";
import UI from "../ui/UI";
import RenderSystem from "./RenderSystem";
import * as RG from "~/lib/render-graph";
import ControlsSystem from "./ControlsSystem";
import SceneSystem from "~/app/systems/SceneSystem";
import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import {getAtoms} from "~/app/ui/state/atoms";
import MapTimeSystem from "~/app/systems/MapTimeSystem";

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

export interface UISystemState {
	activeFeatureType: number;
	activeFeatureId: number;
	fps: number;
	fpsSmooth: number;
	frameTime: number;
	mapTime: number;
	mapTimeMultiplier: number;
	mapTimeMode: number;
	renderGraph: RenderGraphSnapshot;
	resourcesLoadingProgress: number;
	northDirection: number;
}

export interface UIActions {
	updateRenderGraph: () => void;
	goToLatLon: (lat: number, lon: number) => void;
	lookAtNorth: () => void;
}

const FPSUpdateInterval = 0.4;

export default class UISystem extends System {
	private ui: UI;
	private state: UISystemState = {
		activeFeatureType: null,
		activeFeatureId: null,
		fps: 0,
		fpsSmooth: 0,
		frameTime: 0,
		mapTime: Date.now(),
		mapTimeMode: 0,
		mapTimeMultiplier: 1,
		renderGraph: null,
		resourcesLoadingProgress: 0,
		northDirection: 0
	};
	private fpsUpdateTimer = 0;

	public postInit(): void {
		this.ui = new UI(this.state);
		this.updateDOM();

		this.ui.addListener('mapTimeMode', value => {
			const system = this.systemManager.getSystem(MapTimeSystem);

			if (system) {
				system.setState(value);
			}
		});
	}

	private updateDOM(): void {
		const atoms = getAtoms(this.ui);
		const actions: UIActions = {
			updateRenderGraph: () => this.updateRenderGraph(),
			goToLatLon: (lat: number, lon: number): void => {
				this.systemManager.getSystem(ControlsSystem).setLatLon(lat, lon);
			},
			lookAtNorth: () => {
				this.systemManager.getSystem(ControlsSystem).lookAtNorth();
			}
		}

		this.ui.update(atoms, actions);
	}

	public setResourcesLoadingProgress(progress: number): void {
		this.ui.setStateFieldValue('resourcesLoadingProgress', progress);
	}

	public setActiveFeature(type: number, id: number): void {
		console.log(`feature ${type} ${id}`);

		this.ui.setStateFieldValue('activeFeatureId', id);
		this.ui.setStateFieldValue('activeFeatureType', type);
	}

	public clearActiveFeature(): void {
		this.ui.setStateFieldValue('activeFeatureId', null);
		this.ui.setStateFieldValue('activeFeatureType', null);
	}

	public updateFrameTime(frameTime: number): void {
		const value = MathUtils.lerp(this.state.frameTime, frameTime, 0.1);
		this.ui.setStateFieldValue('frameTime', value);
	}

	public get mapTime(): number {
		return this.state.mapTime;
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
		this.ui.setStateFieldValue('renderGraph', this.getRenderGraph());
	}

	public update(deltaTime: number): void {
		const newFps = Math.min(Math.round(1 / deltaTime), 1e3);
		this.ui.setStateFieldValue('fps', MathUtils.lerp(this.state.fps, newFps, 0.1));

		if (this.fpsUpdateTimer >= FPSUpdateInterval) {
			this.fpsUpdateTimer = 0;
			this.ui.setStateFieldValue('fpsSmooth', this.state.fps);
		}

		this.fpsUpdateTimer += deltaTime;

		const newMapTime = this.state.mapTime + deltaTime * 1000 * this.state.mapTimeMultiplier;
		this.ui.setStateFieldValue('mapTime', newMapTime);

		const scene = this.systemManager.getSystem(SceneSystem);

		if (scene) {
			const camera = this.systemManager.getSystem(SceneSystem).objects.camera;
			const dir = Vec3.applyMatrix4(new Vec3(0, 0, -1), camera.matrixWorld);
			const angle = new Vec2(dir.x, dir.z).getAngle();
			this.ui.setStateFieldValue('northDirection', Math.round(-MathUtils.toDeg(angle)));
		}
	}
}