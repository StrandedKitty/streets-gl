import Handler from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";

export default class VectorPolylineHandler implements Handler {
	public constructor(vectorFeature: VectorPolyline) {

	}

	public getFeatures(): Tile3DFeature[] {
		return [];
	}
}