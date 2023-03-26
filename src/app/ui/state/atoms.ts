import {atom, atomFamily, RecoilState, selectorFamily} from "recoil";
import {RenderGraphSnapshot} from "~/app/systems/UISystem";
import {bidirectionalSyncEffect, StateStorage} from "~/app/ui/state/utils";
import {SettingsObject, SettingsObjectEntry} from "~/app/settings/SettingsObject";
import {SettingsSchema} from "~/app/settings/SettingsSchema";
import {OverpassEndpoint} from "~/app/systems/TileLoadingSystem";

export interface AtomsCollection {
	activeFeature: RecoilState<{type: number; id: number}>;
	fps: RecoilState<number>;
	frameTime: RecoilState<number>;
	mapTime: RecoilState<number>;
	mapTimeMultiplier: RecoilState<number>;
	mapTimeMode: RecoilState<number>;
	resourcesLoadingProgress: RecoilState<number>;
	renderGraph: RecoilState<RenderGraphSnapshot>;
	northDirection: RecoilState<number>;
	settingsObject: (param: string) => RecoilState<SettingsObjectEntry>;
	settingsSchema: RecoilState<SettingsSchema>;
	overpassEndpoints: RecoilState<OverpassEndpoint[]>;
}

export const getAtoms = (
	commonStorage: StateStorage,
	settingsStorage: StateStorage
): AtomsCollection => {
	return {
		activeFeature: atom({
			key: 'activeFeature',
			effects: [bidirectionalSyncEffect('activeFeature', commonStorage)]
		}),
		fps: atom({
			key: 'fps',
			effects: [bidirectionalSyncEffect('fpsSmooth', commonStorage)]
		}),
		frameTime: atom({
			key: 'frameTime',
			effects: [bidirectionalSyncEffect('frameTimeSmooth', commonStorage)]
		}),
		mapTime: atom({
			key: 'mapTime',
			effects: [bidirectionalSyncEffect('mapTime', commonStorage)]
		}),
		mapTimeMultiplier: atom({
			key: 'mapTimeMultiplier',
			effects: [bidirectionalSyncEffect('mapTimeMultiplier', commonStorage)]
		}),
		mapTimeMode: atom({
			key: 'mapTimeMode',
			effects: [bidirectionalSyncEffect('mapTimeMode', commonStorage)]
		}),
		resourcesLoadingProgress: atom({
			key: 'resourcesLoadingProgress',
			effects: [bidirectionalSyncEffect('resourcesLoadingProgress', commonStorage)]
		}),
		renderGraph: atom({
			key: 'renderGraph',
			effects: [bidirectionalSyncEffect('renderGraph', commonStorage)]
		}),
		northDirection: atom({
			key: 'northDirection',
			effects: [bidirectionalSyncEffect('northDirection', commonStorage)]
		}),
		settingsObject: atomFamily({
			key: 'settingsObject',
			effects: (key: string) => [bidirectionalSyncEffect(key, settingsStorage)]
		}),
		settingsSchema: atom({
			key: 'settingsSchema',
			effects: [bidirectionalSyncEffect('settingsSchema', commonStorage)]
		}),
		overpassEndpoints: atom({
			key: 'overpassEndpoints',
			effects: [bidirectionalSyncEffect('overpassEndpoints', commonStorage)]
		}),
	};
}