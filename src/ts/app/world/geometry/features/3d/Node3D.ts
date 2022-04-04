import Feature3D, {Tags} from "./Feature3D";
import MathUtils from "../../../../../math/MathUtils";
import Vec2 from "../../../../../math/Vec2";

export default class Node3D extends Feature3D {
	public lat: number;
	public lon: number;
	public position: Vec2;
	public tile: Vec2;

	constructor(id: number, lat: number, lon: number, tags: Tags, tileX: number, tileY: number) {
		super(id, tags);

		this.lat = lat;
		this.lon = lon;

		const pivot = MathUtils.tile2meters(tileX, tileY + 1);

		this.position = Vec2.sub(MathUtils.degrees2meters(this.lat, this.lon), pivot);
		this.tile = MathUtils.degrees2tile(this.lat, this.lon);
	}

	public posEquals(node: Node3D): boolean {
		return this.lat === node.lat && this.lon === node.lon;
	}
}