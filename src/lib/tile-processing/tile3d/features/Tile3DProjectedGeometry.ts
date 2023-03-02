import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import AABB3D from "~/lib/math/AABB3D";

export default interface Tile3DProjectedGeometry extends Tile3DFeature {
	type: 'projected';
	zIndex: number;
	boundingBox: AABB3D;
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
}