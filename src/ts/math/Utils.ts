import Vec3 from "./Vec3";
import Vec2 from "./Vec2";

export function clamp(num: number, min: number, max: number): number {
	return num <= min ? min : num >= max ? max : num;
}

export function lerp(start: number, end: number, amt: number): number {
	return (1 - amt) * start + amt * end
}

export function toRad(degrees: number): number {
	return degrees * Math.PI / 180;
}

export function toDeg(radians: number): number {
	return radians * 180 / Math.PI;
}

export function normalizeAngle(angle: number) {
	return (angle %= 2 * Math.PI) >= 0 ? angle : (angle + 2 * Math.PI);
}

export function sphericalToCartesian(azimuth: number, altitude: number) {
	return new Vec3(
		-Math.cos(altitude) * Math.cos(azimuth),
		-Math.sin(altitude),
		-Math.cos(altitude) * Math.sin(azimuth)
	)
}

export function degrees2meters(lat: number, lon: number): Vec2 {
	let z = lon * 20037508.34 / 180;
	let x = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 20037508.34 / Math.PI;
	return new Vec2(x, z);
}

export function meters2degrees(x: number, z: number): Vec2 {
	let lon = z * 180 / 20037508.34;
	let lat = Math.atan(Math.exp(x * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
	return new Vec2(lat, lon);
}

export function degrees2tile(lat: number, lon: number, zoom: number = 16): Vec2 {
	let x = (lon + 180) / 360 * (1 << zoom);
	let y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom);
	return new Vec2(x, y);
}

export function tile2degrees(x: number, y: number, zoom: number = 16): Vec2 {
	let n = Math.PI - 2 * Math.PI * y / (1 << zoom);
	let lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
	let lon = x / (1 << zoom) * 360 - 180;
	return new Vec2(lat, lon);
}

export function meters2tile(x: number, z: number, zoom = 16): Vec2 {
	let rx = (z + 20037508.34) / (2 * 20037508.34) * (1 << zoom);
	let ry = (1 - (x + 20037508.34) / (2 * 20037508.34)) * (1 << zoom);
	return new Vec2(rx, ry);
}

export function tile2meters(x: number, y: number, zoom = 16): Vec2 {
	let rz = (2 * 20037508.34 * x) / (1 << zoom) - 20037508.34;
	let rx = 20037508.34 - (2 * 20037508.34 * y) / (1 << zoom);
	return new Vec2(rx, rz);
}

export function getTilesIntersectingLine(a: Vec2, b: Vec2): Vec2[] {
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

	while (!(x === endX && y === endY)) {
		if (tMaxX < tMaxY) {
			tMaxX = tMaxX + tDeltaX;
			x = x + stepX;
		} else {
			tMaxY = tMaxY + tDeltaY;
			y = y + stepY;
		}

		points.push(new Vec2(x, y));
	}

	return points;
}
