import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";

export default interface VectorTileHandler {
	getFeatures(): VectorFeature[];
}