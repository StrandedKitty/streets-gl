enum OSMReferenceType {
	None,
	Node,
	Way,
	Relation
}

interface OSMReference {
	type: OSMReferenceType;
	id: number;
}

export default class UniversalFeature {
	public osmReference: OSMReference;
}