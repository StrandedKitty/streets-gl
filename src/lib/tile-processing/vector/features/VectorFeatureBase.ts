import OSMReference from "./OSMReference";

export default interface VectorFeatureBase {
	type: string;
	osmReference: OSMReference;
}