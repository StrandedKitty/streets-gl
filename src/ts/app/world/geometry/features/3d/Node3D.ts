import Feature3D, {Tags} from "./Feature3D";
import {degrees2meters, degrees2tile, tile2meters} from "../../../../../math/Utils";
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

		const pivot = tile2meters(tileX, tileY + 1);

		this.position = Vec2.sub(degrees2meters(this.lat, this.lon), pivot);
		this.tile = degrees2tile(this.lat, this.lon);
	}
}