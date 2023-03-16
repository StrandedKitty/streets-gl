import Vec2 from "~/lib/math/Vec2";

export default class LinkedVertex {
	public next: LinkedVertex = null;
	public prev: LinkedVertex = null;
	public vector: Vec2;

	public constructor(vector: Vec2) {
		this.vector = vector;
	}

	public getDeserializedVector(): string {
		return `${this.vector.x} ${this.vector.y}`;
	}
}