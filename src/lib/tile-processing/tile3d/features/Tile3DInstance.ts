import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export default interface Tile3DInstance extends Tile3DFeature {
	type: 'instance';
	interleavedBuffer: Float32Array;
}