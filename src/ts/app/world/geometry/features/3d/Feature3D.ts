export type Tags = { [key: string]: string };

export default class Feature3D {
	public id: number;
	public tags: Tags;

	constructor(id: number, tags: Tags = {}) {
		this.id = id;
		this.tags = tags;
	}
}