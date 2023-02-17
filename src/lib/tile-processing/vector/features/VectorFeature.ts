import OSMReference from "./OSMReference";

export default interface VectorFeature {
	type: string;
	osmReference: OSMReference;
}