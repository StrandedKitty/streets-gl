export enum OSMReferenceType {
	None,
	Node,
	Way,
	Relation
}

export interface OSMReference {
	type: OSMReferenceType;
	id: number;
}

export default abstract class UniversalFeature {
	protected constructor(public osmReference: OSMReference) {
	}
}