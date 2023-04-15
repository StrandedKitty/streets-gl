import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export type Tile3DInstanceType = 'tree' | 'adColumn' | 'transmissionTower' | 'utilityPole' | 'wire' | 'hydrant'
	| 'trackedCrane' | 'towerCrane' | 'bench' | 'picnicTable' | 'busStop' | 'windTurbine' | 'memorial' | 'statue'
	| 'shrubbery';

export enum InstanceStructure {
	Generic,
	Tree,
	Advanced
}

export interface InstanceStructureSchema {
	componentsPerInstance: number;
	getComponents(instance: Tile3DInstance): number[];
}

export const InstanceStructureSchemas: Record<InstanceStructure, InstanceStructureSchema> = {
	[InstanceStructure.Generic]: {
		componentsPerInstance: 5,
		getComponents(instance: Tile3DInstance): number[] {
			return [instance.x, instance.y, instance.z, instance.scale, instance.rotation];
		}
	},
	[InstanceStructure.Tree]: {
		componentsPerInstance: 6,
		getComponents(instance: Tile3DInstance): number[] {
			return [instance.x, instance.y, instance.z, instance.scale, instance.rotation, instance.textureId];
		}
	},
	[InstanceStructure.Advanced]: {
		componentsPerInstance: 9,
		getComponents(instance: Tile3DInstance): number[] {
			return [
				instance.x, instance.y, instance.z,
				instance.scaleX, instance.scaleY, instance.scaleZ,
				instance.rotationX, instance.rotationY, instance.rotationZ
			];
		}
	}
};

export interface LODConfig {
	structure: InstanceStructure;
	LOD0MaxDistance: number;
	LOD1MaxDistance: number;
	LOD1Fraction: number;
}

export const Tile3DInstanceLODConfig: Record<Tile3DInstanceType, LODConfig> = {
	tree: {
		structure: InstanceStructure.Tree,
		LOD0MaxDistance: 2000,
		LOD1MaxDistance: 5000,
		LOD1Fraction: 0.5
	},
	shrubbery: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1200,
		LOD1MaxDistance: 2500,
		LOD1Fraction: 0.5,
	},
	adColumn: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	transmissionTower: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	utilityPole: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	wire: {
		structure: InstanceStructure.Advanced,
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	hydrant: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	trackedCrane: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 2000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	towerCrane: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 3000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	bench: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	picnicTable: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	busStop: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	windTurbine: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 5000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	memorial: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 2000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	},
	statue: {
		structure: InstanceStructure.Generic,
		LOD0MaxDistance: 1000,
		LOD1MaxDistance: 0,
		LOD1Fraction: 0,
	}
	// power lines, etc.
};

export default interface Tile3DInstance extends Tile3DFeature {
	type: 'instance';
	instanceType: Tile3DInstanceType;
	x: number;
	y: number;
	z: number;
	scale?: number;
	rotation?: number;
	scaleX?: number;
	scaleY?: number;
	scaleZ?: number;
	rotationX?: number;
	rotationY?: number;
	rotationZ?: number;
	textureId?: number;
	seed?: number;
}

