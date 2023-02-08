import {atom, RecoilState} from "recoil";
import {RenderGraphSnapshot} from "~/app/systems/UISystem";
import {bidirectionalSyncEffect} from "~/app/ui/state/utils";

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

const atoms: AtomsCollection = {
	activeFeatureId: atom<number>({
		key: 'activeFeatureId',
		effects: [bidirectionalSyncEffect('activeFeatureId')]
	}),
	activeFeatureType: atom<number>({
		key: 'activeFeatureType',
		effects: [bidirectionalSyncEffect('activeFeatureType')]
	}),
	fps: atom<number>({
		key: 'fps',
		effects: [bidirectionalSyncEffect('fpsSmooth')]
	}),
	frameTime: atom<number>({
		key: 'frameTime',
		effects: [bidirectionalSyncEffect('frameTime')]
	}),
	mapTime: atom<number>({
		key: 'mapTime',
		effects: [bidirectionalSyncEffect('mapTime')]
	}),
	mapTimeMultiplier: atom<number>({
		key: 'mapTimeMultiplier',
		effects: [bidirectionalSyncEffect('mapTimeMultiplier')]
	}),
	mapTimeMode: atom<number>({
		key: 'mapTimeMode',
		effects: [bidirectionalSyncEffect('mapTimeMode')]
	}),
	resourcesLoadingProgress: atom<number>({
		key: 'resourcesLoadingProgress',
		effects: [bidirectionalSyncEffect('resourcesLoadingProgress')]
	}),
	renderGraph: atom<RenderGraphSnapshot>({
		key: 'renderGraph',
		effects: [bidirectionalSyncEffect('renderGraph')]
	}),
	northDirection: atom<number>({
		key: 'northDirection',
		effects: [bidirectionalSyncEffect('northDirection')]
	})
}

export default atoms;