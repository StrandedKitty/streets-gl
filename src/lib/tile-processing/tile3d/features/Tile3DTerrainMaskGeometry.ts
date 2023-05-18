import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import AABB3D from "~/lib/math/AABB3D";

export default interface Tile3DTerrainMaskGeometry extends Tile3DFeature {
	type: 'mask';
	positionBuffer: Float32Array;
}