import Feature3D, {Tags} from "./Feature3D";

export default class Node3D extends Feature3D {
	public lat: number;
	public lon: number;

	constructor(id: number, lat: number, lon: number, tags: Tags) {
		super(id, tags);

		this.lat = lat;
		this.lon = lon;
	}
}