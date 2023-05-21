import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export default interface Tile3DTerrainMaskGeometry extends Tile3DFeature {
	type: 'mask';
	positionBuffer: Float32Array;
}