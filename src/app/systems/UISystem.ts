import System from "../System";
import MathUtils from "~/lib/math/MathUtils";
import UI from "../ui/UI";
import RenderSystem from "./RenderSystem";
import * as RG from "~/lib/render-graph";
import ControlsSystem from "./ControlsSystem";
import {getAtoms} from "~/app/ui/state/atoms";
import MapTimeSystem from "~/app/systems/MapTimeSystem";
import PickingSystem from "~/app/systems/PickingSystem";
import SettingsSystem from "~/app/systems/SettingsSystem";
import SettingsStorageDecorator from "~/app/settings/SettingsStorageDecorator";
import Utils from "~/app/Utils";
import TileLoadingSystem, {OverpassEndpoint} from "~/app/systems/TileLoadingSystem";
import UISystemState from "~/app/ui/UISystemState";
import RenderGraphSnapshot from "~/app/ui/RenderGraphSnapshot";
import UIActions from "~/app/ui/UIActions";

const FPSUpdateInterval = 0.4;

export default class UISystem extends System {
	private ui: UI;
	private state: UISystemState = {
		activeFeature: null,
		fps: 0,
		fpsSmooth: 0,
		frameTime: 0,
		frameTimeSmooth: 0,
		mapTime: Date.now(),
		mapTimeMode: this.getMapTimeModeFromLocalStorage(),
		mapTimeMultiplier: 1,
		renderGraph: null,
		resourcesLoadingProgress: 0,
		resourceInProgressPath: '',
		northDirection: 0,
		settingsSchema: {},
		overpassEndpoints: [],
		dataTimestamp: null
	};
	private fpsUpdateTimer = 0;

	public postInit(): void {
		this.ui = new UI(this.state);
		this.updateDOM();

		this.systemManager.onSystemReady(MapTimeSystem, system => {
			this.ui.addStateFieldListener('mapTimeMode', value => {
				system.setState(value);
				localStorage.setItem('mapTimeMode', value.toString());
			});
		});

		this.systemManager.onSystemReady(PickingSystem, system => {
			this.ui.addStateFieldListener('activeFeature', value => {
				if (!value) {
					system.clearSelection();
				}
			});
		});

		this.systemManager.onSystemReady(TileLoadingSystem, system => {
			this.ui.addStateFieldListener('overpassEndpoints', value => {
				if (value.length > 0) {
					system.setOverpassEndpoints(value);
				}
			});

			system.fetchTilesTimestamp().then(timestamp => {
				this.ui.setStateFieldValue('dataTimestamp', timestamp);
			});
		});

		this.state.settingsSchema = this.systemManager.getSystem(SettingsSystem).schema;

		this.detectMobile();
	}

	private detectMobile(): void {
		if (Utils.isMobileBrowser() || !window.matchMedia("(pointer: fine)").matches) {
			alert('Mobile devices and touch devices are not supported. Please use a computer with a mouse and keyboard.');
		}
	}

	private updateDOM(): void {
		const settingsSystem = this.systemManager.getSystem(SettingsSystem);
		const commonStorage = this.ui;
		const settingsStorage = new SettingsStorageDecorator(settingsSystem.settings);

		const atoms = getAtoms(commonStorage, settingsStorage);

		const actions: UIActions = {
			updateRenderGraph: () => this.updateRenderGraph(),
			goToLatLon: (lat: number, lon: number): void => {
				this.systemManager.getSystem(ControlsSystem).setLatLon(lat, lon);
			},
			goToState: (lat: number, lon: number, pitch: number, yaw: number, distance: number): void => {
				this.systemManager.getSystem(ControlsSystem).setState(lat, lon, pitch, yaw, distance);
			},
			lookAtNorth: () => {
				this.systemManager.getSystem(ControlsSystem).lookAtNorth();
			},
			setTime: (time: number) => {
				this.ui.setStateFieldValue('mapTime', time);
			},
			resetSettings: () => settingsSystem.resetSettings(),
			setOverpassEndpoints: (endpoints: OverpassEndpoint[]) => {
				this.ui.setStateFieldValue('overpassEndpoints', endpoints);
			},
			resetOverpassEndpoints: () => {
				this.systemManager.getSystem(TileLoadingSystem).resetOverpassEndpoints();
			},
			getControlsStateHash: (): string => {
				return this.systemManager.getSystem(ControlsSystem).getCurrentStateHash();
			}
		}

		this.ui.update(atoms, actions);
	}

	public setResourcesLoadingProgress(progress: number): void {
		this.ui.setStateFieldValue('resourcesLoadingProgress', progress);
	}

	public setResourceInProgressPath(path: string): void {
		this.ui.setStateFieldValue('resourceInProgressPath', path);
	}

	public setActiveFeature(type: number, id: number): void {
		console.log(`feature ${type} ${id}`);

		this.ui.setStateFieldValue('activeFeature', {type, id});
	}

	public clearActiveFeature(): void {
		this.ui.setStateFieldValue('activeFeature', null);
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

	private getMapTimeModeFromLocalStorage(): number {
		const saved = localStorage.getItem('mapTimeMode');

		if (saved !== null) {
			return parseInt(saved);
		}

		return 1;
	}

	private updateNorthDirection(): void {
		const controlsSystem = this.systemManager.getSystem(ControlsSystem);
		if (controlsSystem) {
			this.ui.setStateFieldValue('northDirection', Math.round(-MathUtils.toDeg(controlsSystem.northDirection)));
		}
	}

	private updateOverpassEndpoints(): void {
		const tileLoadingSystem = this.systemManager.getSystem(TileLoadingSystem);
		if (tileLoadingSystem) {
			this.ui.setStateFieldValue('overpassEndpoints', tileLoadingSystem.overpassEndpoints);
		}
	}

	private updateMapTime(deltaTime: number): void {
		const newMapTime = this.state.mapTime + deltaTime * 1000 * this.state.mapTimeMultiplier;
		this.ui.setStateFieldValue('mapTime', newMapTime);
	}

	private updateFPS(deltaTime: number): void {
		const newFps = Math.min(Math.round(1 / deltaTime), 1e3);
		this.ui.setStateFieldValue('fps', MathUtils.lerp(this.state.fps, newFps, 0.1));

		if (this.fpsUpdateTimer >= FPSUpdateInterval) {
			this.fpsUpdateTimer = 0;
			this.ui.setStateFieldValue('fpsSmooth', this.state.fps);
			this.ui.setStateFieldValue('frameTimeSmooth', this.state.frameTime);
		}

		this.fpsUpdateTimer += deltaTime;
	}

	public update(deltaTime: number): void {
		this.updateFPS(deltaTime);
		this.updateMapTime(deltaTime);
		this.updateOverpassEndpoints();
		this.updateNorthDirection();
	}
}
