import OSMFeature, {OSMTags} from "./OSMFeature";

export interface OSMRelationMember {
	feature: OSMFeature;
	role: string;
}

export default class OSMRelation extends OSMFeature {
	public members: OSMRelationMember[];

	public constructor(id: number, members: OSMRelationMember[], tags: OSMTags) {
		super(id, tags);

		this.members = members;
	}
}