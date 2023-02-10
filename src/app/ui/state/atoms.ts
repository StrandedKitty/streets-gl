import {atom, RecoilState} from "recoil";
import {RenderGraphSnapshot} from "~/app/systems/UISystem";
import {bidirectionalSyncEffect} from "~/app/ui/state/utils";
import UI from "~/app/ui/UI";

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
}

export const getAtoms = (ui: UI): AtomsCollection => {
	return {
		activeFeature: atom({
			key: 'activeFeature',
			effects: [bidirectionalSyncEffect('activeFeature', ui)]
		}),
		fps: atom({
			key: 'fps',
			effects: [bidirectionalSyncEffect('fpsSmooth', ui)]
		}),
		frameTime: atom({
			key: 'frameTime',
			effects: [bidirectionalSyncEffect('frameTime', ui)]
		}),
		mapTime: atom({
			key: 'mapTime',
			effects: [bidirectionalSyncEffect('mapTime', ui)]
		}),
		mapTimeMultiplier: atom({
			key: 'mapTimeMultiplier',
			effects: [bidirectionalSyncEffect('mapTimeMultiplier', ui)]
		}),
		mapTimeMode: atom({
			key: 'mapTimeMode',
			effects: [bidirectionalSyncEffect('mapTimeMode', ui)]
		}),
		resourcesLoadingProgress: atom({
			key: 'resourcesLoadingProgress',
			effects: [bidirectionalSyncEffect('resourcesLoadingProgress', ui)]
		}),
		renderGraph: atom({
			key: 'renderGraph',
			effects: [bidirectionalSyncEffect('renderGraph', ui)]
		}),
		northDirection: atom({
			key: 'northDirection',
			effects: [bidirectionalSyncEffect('northDirection', ui)]
		})
	};
}