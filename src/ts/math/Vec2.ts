import Mat3 from "./Mat3";

export default class Vec2 {
	public x: number;
	public y: number;

	public constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	public set(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}

	public equals(v: Vec2): boolean {
		return this.x === v.x && this.y === v.y;
	}

	public static add(a: Vec2, b: Vec2): Vec2 {
		return new Vec2(a.x + b.x, a.y + b.y);
	}

	public static sub(a: Vec2, b: Vec2): Vec2 {
		return new Vec2(a.x - b.x, a.y - b.y);
	}

	public static addScalar(v: Vec2, s: number): Vec2 {
		return new Vec2(v.x + s, v.y + s);
	}

	public static multiplyScalar(v: Vec2, s: number): Vec2 {
		return new this(v.x * s, v.y * s);
	}

	public static normalize(v: Vec2): Vec2 {
		const dst = new this;
		const length = Math.sqrt(v.x ** 2 + v.y ** 2);

		if (length > 0.00001) {
			dst.x = v.x / length;
			dst.y = v.y / length;
		}

		return dst;
	}

	public static getLength(v: Vec2): number {
		return Math.sqrt(v.x ** 2 + v.y ** 2);
	}

	public static dot(a: Vec2, b: Vec2): number {
		const num = (a.x * b.x) + (a.y * b.y);
		return num <= -1 ? -1 : num >= 1 ? 1 : num;
	}

	public static distance(a: Vec2, b: Vec2): number {
		return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
	}

	public static angleClockwise(a: Vec2, b: Vec2): number {
		const dot = a.x * b.x + a.y * b.y;
		const det = a.x * b.y - a.y * b.x;
		return Math.atan2(det, dot);
	}

	public getAngle(): number {
		return Math.atan2(this.y, this.x);
	}

	public static rotate(v: Vec2, angle: number): Vec2 {
		return new Vec2(
			v.x * Math.cos(angle) - v.y * Math.sin(angle),
			v.x * Math.sin(angle) + v.y * Math.cos(angle)
		);
	}

	public static rotateLeft(v: Vec2): Vec2 {
		return new Vec2(-v.y, v.x);
	}

	public static rotateRight(v: Vec2): Vec2 {
		return new Vec2(v.y, -v.x);
	}

	public static applyMatrix3(v: Vec2, mat: Mat3): Vec2 {
		const dst = new Vec2();
		const m = mat.values;

		const x = v.x, y = v.y;

		dst.x = m[0] * x + m[3] * y + m[6];
		dst.y = m[1] * x + m[4] * y + m[7];

		return dst;
	}

	public static copy(v: Vec2): Vec2 {
		return new this(v.x, v.y);
	}

	public static toArray(v: Vec2): [number, number] {
		return [v.x, v.y];
	}
}
