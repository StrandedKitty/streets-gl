import OSMDescriptor from "../../OSMDescriptor";

export type OSMTags = { [key: string]: string };

export default class OSMFeature {
	public id: number;
	public tags: OSMTags;
	public descriptor: OSMDescriptor;

	public constructor(id: number, tags: OSMTags = {}) {
		this.id = id;
		this.tags = tags;
		this.descriptor = new OSMDescriptor(this);
	}
}