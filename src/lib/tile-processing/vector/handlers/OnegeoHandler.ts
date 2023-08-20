import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";

export default interface OnegeoHandler {
	getFeatures(): VectorFeature[];
}
