export enum OSMReferenceType {
	None,
	Node,
	Way,
	Relation
}

export default interface OSMReference {
	type: OSMReferenceType;
	id: number;
}