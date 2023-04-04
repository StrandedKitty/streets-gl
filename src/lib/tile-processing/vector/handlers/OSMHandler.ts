import VectorFeature from "~/lib/tile-processing/vector/features/VectorFeature";

export default interface OSMHandler {
	getFeatures(): VectorFeature[];
	getStructuralFeature(): VectorFeature;
	preventFeatureOutput(): void;
	markAsBuildingPartInRelation(): void;
}