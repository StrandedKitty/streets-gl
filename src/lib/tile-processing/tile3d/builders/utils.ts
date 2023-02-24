import Vec2 from "~/lib/math/Vec2";

export function colorToComponents(color: number): [number, number, number] {
	return [
		color >> 16,
		color >> 8 & 0xff,
		color & 0xff
	];
}

export function signedDstToLine(point: Vec2, line: [Vec2, Vec2]): number {
	const lineVector = Vec2.sub(line[1], line[0]);
	const pointVector = Vec2.sub(point, line[0]);
	const cross = lineVector.x * pointVector.y - lineVector.y * pointVector.x;
	const lineLength = Math.hypot(lineVector.x, lineVector.y);

	return cross / lineLength;
}