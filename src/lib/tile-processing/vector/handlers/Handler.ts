import VectorFeature from "~/lib/tile-processing/vector/features/VectorFeature";

export default interface Handler {
	getFeatures(): VectorFeature[];
	getStructuralFeature(): VectorFeature;
	preventFeatureOutput(): void;
	markAsBuildingPartInRelation(): void;
}