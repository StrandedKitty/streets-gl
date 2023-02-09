import {atom, RecoilState} from "recoil";
import {RenderGraphSnapshot} from "~/app/systems/UISystem";
import {bidirectionalSyncEffect} from "~/app/ui/state/utils";
import UI from "~/app/ui/UI";

export interface AtomsCollection {
	activeFeatureType: RecoilState<number>;
	activeFeatureId: RecoilState<number>;
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
		activeFeatureId: atom<number>({
			key: 'activeFeatureId',
			effects: [bidirectionalSyncEffect('activeFeatureId', ui)]
		}),
		activeFeatureType: atom<number>({
			key: 'activeFeatureType',
			effects: [bidirectionalSyncEffect('activeFeatureType', ui)]
		}),
		fps: atom<number>({
			key: 'fps',
			effects: [bidirectionalSyncEffect('fpsSmooth', ui)]
		}),
		frameTime: atom<number>({
			key: 'frameTime',
			effects: [bidirectionalSyncEffect('frameTime', ui)]
		}),
		mapTime: atom<number>({
			key: 'mapTime',
			effects: [bidirectionalSyncEffect('mapTime', ui)]
		}),
		mapTimeMultiplier: atom<number>({
			key: 'mapTimeMultiplier',
			effects: [bidirectionalSyncEffect('mapTimeMultiplier', ui)]
		}),
		mapTimeMode: atom<number>({
			key: 'mapTimeMode',
			effects: [bidirectionalSyncEffect('mapTimeMode', ui)]
		}),
		resourcesLoadingProgress: atom<number>({
			key: 'resourcesLoadingProgress',
			effects: [bidirectionalSyncEffect('resourcesLoadingProgress', ui)]
		}),
		renderGraph: atom<RenderGraphSnapshot>({
			key: 'renderGraph',
			effects: [bidirectionalSyncEffect('renderGraph', ui)]
		}),
		northDirection: atom<number>({
			key: 'northDirection',
			effects: [bidirectionalSyncEffect('northDirection', ui)]
		})
	};
}