export type Tags = { [key: string]: string | number };

export default class Feature3D {
	public id: number;
	public tags: Tags;
	public visible: boolean = true;

	constructor(id: number, tags: Tags = {}) {
		this.id = id;
		this.tags = tags;
	}
}