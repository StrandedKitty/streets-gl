import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";

export default class VectorNodeHandler implements Handler {
	public constructor(vectorFeature: VectorNode) {

	}

	public getFeatures(): Tile3DFeature[] {
		return [];
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		return null;
	}
}