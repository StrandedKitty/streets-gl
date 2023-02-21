import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import AABB2D from "~/lib/math/AABB2D";

export default interface Tile3DProjectedGeometry extends Tile3DFeature {
	type: 'projected';
	boundingBox: AABB2D;
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
}