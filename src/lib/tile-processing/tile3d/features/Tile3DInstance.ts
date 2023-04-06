import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export type Tile3DInstanceType = 'tree' | 'adColumn' | 'transmissionTower' | 'hydrant' | 'trackedCrane' | 'towerCrane';

export interface LODConfig {
	LOD0MaxDistance: number;
	LOD1MaxDistance: number;
	LOD1Fraction: number;
}

export const Tile3DInstanceLODConfig: Record<Tile3DInstanceType, LODConfig> = {
	tree: {
		LOD0MaxDistance: 2000,
		LOD1MaxDistance: 5000,
		LOD1Fraction: 0.5,
	},
	adColumn: {
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	transmissionTower: {
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	hydrant: {
		LOD0MaxDistance: 500,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	trackedCrane: {
		LOD0MaxDistance: 2000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	towerCrane: {
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	}
};

export default interface Tile3DInstance extends Tile3DFeature {
	type: 'instance';
	instanceType: Tile3DInstanceType;
	x: number;
	y: number;
	z: number;
	scale: number;
	rotation: number;
}

