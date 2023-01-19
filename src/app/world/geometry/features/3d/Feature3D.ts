export type Tags = { [key: string]: string | number | number[] };

export default class Feature3D {
	public id: number;
	public tags: Tags;
	public visible = true;

	public constructor(id: number, tags: Tags = {}) {
		this.id = id;
		this.tags = tags;
	}
}