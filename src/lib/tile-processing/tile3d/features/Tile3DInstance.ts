import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export default interface Tile3DInstance extends Tile3DFeature {
	type: 'instance';
	instanceType: 'tree' | 'adColumn' | 'transmissionTower' | 'hydrant';
	x: number;
	y: number;
	z: number;
	scale: number;
	rotation: number;
}

