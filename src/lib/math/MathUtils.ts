import Vec3 from "./Vec3";
import Vec2 from "./Vec2";

export default class MathUtils {
	public static clamp(num: number, min: number, max: number): number {
		return num <= min ? min : num >= max ? max : num;
	}

	public static lerp(start: number, end: number, amt: number): number {
		return (1 - amt) * start + amt * end
	}

	public static shortestAngleDistance(a0: number, a1: number): number {
		const max = Math.PI * 2;
		const da = (a1 - a0) % max;
		return 2 * da % max - da;
	}

	public static lerpAngle(a0: number, a1: number, t: number): number {
		return a0 + this.shortestAngleDistance(a0, a1) * t;
	}

	public static toRad(degrees: number): number {
		return degrees * Math.PI / 180;
	}

	public static toDeg(radians: number): number {
		return radians * 180 / Math.PI;
	}

	public static mod(n: number, m: number): number {
		return ((n % m) + m) % m;
	}

	public static normalizeAngle(angle: number): number {
		return (angle %= 2 * Math.PI) >= 0 ? angle : (angle + 2 * Math.PI);
	}

	public static polarToCartesian(azimuth: number, altitude: number): Vec3 {
		return new Vec3(
			Math.cos(altitude) * Math.cos(azimuth),
			Math.sin(altitude),
			Math.cos(altitude) * Math.sin(azimuth)
		)
	}

	public static cartesianToPolar(position: Vec3): [number, number] {
		const lon = Math.atan2(position.x, -position.z) + Math.PI / 2;
		const length = Math.sqrt(position.x * position.x + position.z * position.z);
		const lat = Math.atan2(position.y, length);

		return [lat, lon];
	}

	public static degrees2meters(lat: number, lon: number): Vec2 {
		const z = lon * 20037508.34 / 180;
		const x = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 20037508.34 / Math.PI;
		return new Vec2(x, z);
	}

	public static meters2degrees(x: number, z: number): {lat: number; lon: number} {
		const lon = z * 180 / 20037508.34;
		const lat = Math.atan(Math.exp(x * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
		return {lat, lon};
	}

	public static degrees2tile(lat: number, lon: number, zoom = 16): Vec2 {
		const x = (lon + 180) / 360 * (1 << zoom);
		const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom);
		return new Vec2(x, y);
	}

	public static tile2degrees(x: number, y: number, zoom = 16): {lat: number; lon: number} {
		const n = Math.PI - 2 * Math.PI * y / (1 << zoom);
		const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
		const lon = x / (1 << zoom) * 360 - 180;
		return {lat, lon};
	}

	public static meters2tile(x: number, z: number, zoom = 16): Vec2 {
		const rx = (z + 20037508.34) / (2 * 20037508.34) * (1 << zoom);
		const ry = (1 - (x + 20037508.34) / (2 * 20037508.34)) * (1 << zoom);
		return new Vec2(rx, ry);
	}

	public static tile2meters(x: number, y: number, zoom = 16): Vec2 {
		const rz = (2 * 20037508.34 * x) / (1 << zoom) - 20037508.34;
		const rx = 20037508.34 - (2 * 20037508.34 * y) / (1 << zoom);
		return new Vec2(rx, rz);
	}

	public static getTilesIntersectingLine(a: Vec2, b: Vec2): Vec2[] {
		let x = Math.floor(a.x);
		let y = Math.floor(a.y);
		const endX = Math.floor(b.x);
		const endY = Math.floor(b.y);

		const points: Vec2[] = [new Vec2(x, y)];

		if (x === endX && y === endY) {
			return points;
		}

		const stepX = Math.sign(b.x - a.x);
		const stepY = Math.sign(b.y - a.y);

		const toX = Math.abs(a.x - x - Math.max(0, stepX));
		const toY = Math.abs(a.y - y - Math.max(0, stepY));

		const vX = Math.abs(a.x - b.x);
		const vY = Math.abs(a.y - b.y);

		let tMaxX = toX === 0 ? 0 : (toX / vX);
		let tMaxY = toY === 0 ? 0 : (toY / vY);

		const tDeltaX = 1 / vX;
		const tDeltaY = 1 / vY;

		let i = 0;

		while (!(x === endX && y === endY) && i < 10000) {
			if (tMaxX <= tMaxY) {
				tMaxX = tMaxX + tDeltaX;
				x = x + stepX;
			} else {
				tMaxY = tMaxY + tDeltaY;
				y = y + stepY;
			}

			points.push(new Vec2(x, y));

			i++;
		}

		return points;
	}

	public static getMercatorScaleFactor(lat: number): number {
		return 1 / Math.cos(MathUtils.toRad(lat));
	}

	public static getMercatorScaleFactorForTile(x: number, y: number, zoom: number): number {
		const {lat} = MathUtils.tile2degrees(x, y, zoom);
		return this.getMercatorScaleFactor(lat);
	}

	public static shiftLeft(num: number, bits: number): number {
		return num * Math.pow(2, bits);
	}

	public static shiftRight(num: number, bits: number): number {
		return Math.floor(num / Math.pow(2, bits));
	}

	public static calculateNormal(vA: Vec3, vB: Vec3, vC: Vec3): Vec3 {
		let cb = Vec3.sub(vC, vB);
		const ab = Vec3.sub(vA, vB);
		cb = Vec3.cross(cb, ab);
		return Vec3.normalize(cb);
	}

	public static getBarycentricCoordinatesOfPoint(point: Vec2, triangle: number[] | TypedArray): Vec3 {
		const a = new Vec2(triangle[0], triangle[1]);
		const b = new Vec2(triangle[2], triangle[3]);
		const c = new Vec2(triangle[4], triangle[5]);

		const v0 = Vec2.sub(b, a);
		const v1 = Vec2.sub(c, a);
		const v2 = Vec2.sub(point, a);

		const den = v0.x * v1.y - v1.x * v0.y;
		const v = (v2.x * v1.y - v1.x * v2.y) / den;
		const w = (v0.x * v2.y - v2.x * v0.y) / den;
		const u = 1 - v - w;

		return new Vec3(u, v, w);
	}

	public static sign(p1: number[], p2: number[], p3: number[]): number {
		return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
	}

	public static isPointInTriangle(point: [number, number], triangle: [number, number][]): boolean {
		const [v1, v2, v3] = triangle;
		const d1 = MathUtils.sign(point, v1, v2);
		const d2 = MathUtils.sign(point, v2, v3);
		const d3 = MathUtils.sign(point, v3, v1);

		const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
		const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

		return !(has_neg && has_pos);
	}

	public static getIntersectionPoint(
		l1p1: [number, number], l1p2: [number, number],
		l2p1: [number, number], l2p2: [number, number]
	): [number, number] {
		const [x1, y1] = l1p1;
		const [x2, y2] = l1p2;
		const [x3, y3] = l2p1;
		const [x4, y4] = l2p2;

		// Check if none of the lines are of length 0
		if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
			return null;
		}

		const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

		// Lines are parallel
		if (denominator === 0) {
			return null;
		}

		const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
		const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

		// is the intersection along the segments
		if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
			return null;
		}

		const x = x1 + ua * (x2 - x1)
		const y = y1 + ua * (y2 - y1)

		return [x, y];
	}

	public static getIntersectionsLineTriangle(
		lineStart: [number, number], lineEnd: [number, number],
		triangle: [number, number][]
	): [number, number][] {
		const intersectionPoints = [];

		for (let i = 0; i < triangle.length; i++) {
			const next = (i + 1 == triangle.length) ? 0 : i + 1;
			const ip = MathUtils.getIntersectionPoint(lineStart, lineEnd, triangle[i], triangle[next]);

			if (ip) {
				intersectionPoints.push(ip);
			}
		}

		return intersectionPoints;
	}

	public static orderConvexPolygonPoints(points: [number, number][]): [number, number][] {
		let mX = 0;
		let mY = 0;

		for (const point of points) {
			mX += point[0];
			mY += point[1];
		}

		mX /= points.length;
		mY /= points.length;

		const atanValues: Map<[number, number], number> = new Map();

		for (const point of points) {
			atanValues.set(point, Math.atan2(point[1] - mY, point[0] - mX));
		}

		points.sort((a, b) => {
			return atanValues.get(a) - atanValues.get(b);
		});

		return points;
	}

	public static findIntersectionTriangleTriangle(tri1: [number, number][], tri2: [number, number][]): [number, number][] {
		const clippedCorners: [number, number][] = [];

		const addPoint = (p1: [number, number]): void => {
			if (clippedCorners.some(p2 => p1[0] === p2[0] && p1[1] === p2[1])) {
				return;
			}

			clippedCorners.push(p1);
		}

		for (const point of tri1) {
			if (MathUtils.isPointInTriangle(point, tri2)) {
				addPoint(point);
			}
		}

		for (const point of tri2) {
			if (MathUtils.isPointInTriangle(point, tri1)) {
				addPoint(point);
			}
		}

		for (let i = 0, next = 1; i < tri1.length; i++, next = (i + 1 == tri1.length) ? 0 : i + 1) {
			const points = MathUtils.getIntersectionsLineTriangle(tri1[i], tri1[next], tri2);

			for (const point of points) {
				addPoint(point);
			}
		}

		return MathUtils.orderConvexPolygonPoints(clippedCorners);
	}

	public static getPolygonCentroid(points: [number, number][]): [number, number] {
		//Correction for very small polygons:
		const x0 = points[0][0], y0 = points[0][1];

		let x = 0, y = 0, twiceArea = 0;
		let prev = points[points.length - 1];

		for (const next of points) {
			const x1 = prev[0] - x0, y1 = prev[1] - y0,
				x2 = next[0] - x0, y2 = next[1] - y0,
				a = x1 * y2 - x2 * y1;

			twiceArea += a;
			x += (x1 + x2) * a;
			y += (y1 + y2) * a;

			prev = next;
		}

		const factor = 3 * twiceArea;  // 6 * twiceArea/2
		x /= factor;
		y /= factor;

		return [x + x0, y + y0];
	}

	public static getPolygonCentroidVec2(points: Vec2[]): Vec2 {
		//Correction for very small polygons:
		const x0 = points[0].x, y0 = points[0].y;

		let x = 0, y = 0, twiceArea = 0;
		let prev = points[points.length - 1];

		for (const next of points) {
			const x1 = prev.x - x0, y1 = prev.y - y0,
				x2 = next.x - x0, y2 = next.y - y0,
				a = x1 * y2 - x2 * y1;

			twiceArea += a;
			x += (x1 + x2) * a;
			y += (y1 + y2) * a;

			prev = next;
		}

		const factor = 3 * twiceArea;  // 6 * twiceArea/2
		x /= factor;
		y /= factor;

		return new Vec2(x + x0, y + y0);
	}

	public static isPointInsidePolygon(point: [number, number], vs: [number, number][]): boolean {
		// https://github.com/substack/point-in-polygon

		const x = point[0], y = point[1];

		let inside = false;
		for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			const xi = vs[i][0], yi = vs[i][1];
			const xj = vs[j][0], yj = vs[j][1];

			const intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	}

	public static isPointInsidePolygonVec2(point: Vec2, vs: Vec2[]): boolean {
		// https://github.com/substack/point-in-polygon

		const {x, y} = point;

		let inside = false;
		for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			const xi = vs[i].x, yi = vs[i].y;
			const xj = vs[j].x, yj = vs[j].y;

			const intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	}

	public static getPointProgressAlongLineSegment(start: Vec2, end: Vec2, point: Vec2, clamp: boolean = true): number {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const lengthSquared = dx * dx + dy * dy;
		const dotProduct = ((point.x - start.x) * dx + (point.y - start.y) * dy);
		const progress = dotProduct / lengthSquared;

		if (!clamp) {
			return progress;
		}

		return MathUtils.clamp(progress, 0, 1);
	}
}

