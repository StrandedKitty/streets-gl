import Vec2 from "~/lib/math/Vec2";

export default class RoadBuilder {
	public build(
		{
			vertices,
			width
		}: {
			vertices: Vec2[];
			width: number;
		}
	): {position: number[]; uv: number[]} {
		const isClosed = vertices[0].equals(vertices[vertices.length - 1]);
		const points = [...vertices];

		if (isClosed) {
			points.pop();
		}

		const controlPoints = RoadBuilder.getControlPoints(points, isClosed, width);

		return RoadBuilder.buildSegmentsFromControlPoints(controlPoints, isClosed);
	}

	private static buildSegmentsFromControlPoints(controlPoints: Vec2[][], isClosed: boolean): {position: number[]; uv: number[]} {
		const position: number[] = [];
		const uv: number[] = [];
		let uvProgress = 0;

		const segmentCount = controlPoints.length - (isClosed ? 0 : 1);

		const uvScaleY = 3;

		for (let i = 0; i < segmentCount; i++) {
			const current = controlPoints[i];
			const next = controlPoints[(i + 1) % controlPoints.length];

			const a = current[0];
			const b = current[1];
			const c = next[2];
			const d = next[3];

			if (current[4]) {
				const inverse = current[2].equals(current[0]);

				const triLengthA = Vec2.getLength(Vec2.sub(current[4], !inverse ? a : b));
				const triLengthB = Vec2.getLength(Vec2.sub(current[4], !inverse ? current[2] : current[3]));

				const startA = uvProgress;
				const endA = startA + triLengthA;
				const startB = endA;
				const endB = startB + triLengthB;

				position.push(
					a.x, 0, a.y,
					b.x, 0, b.y,
					current[4].x, 0, current[4].y
				);
				position.push(
					current[2].x, 0, current[2].y,
					current[3].x, 0, current[3].y,
					current[4].x, 0, current[4].y
				);

				uv.push(
					0, endB / uvScaleY,
					1, endB / uvScaleY,
					inverse ? 1 : 0, startB / uvScaleY
				);
				uv.push(
					0, startA / uvScaleY,
					1, startA / uvScaleY,
					inverse ? 1 : 0, endA / uvScaleY
				);

				uvProgress = endB;
			}

			const segmentLength = Vec2.getLength(Vec2.sub(a, c));
			const uvStart = uvProgress;
			const uvEnd = uvProgress + segmentLength;

			uvProgress = uvEnd;

			position.push(
				a.x, 0, a.y,
				b.x, 0, b.y,
				c.x, 0, c.y
			);
			position.push(
				b.x, 0, b.y,
				d.x, 0, d.y,
				c.x, 0, c.y
			);

			uv.push(
				0, uvStart / uvScaleY,
				1, uvStart / uvScaleY,
				0, uvEnd / uvScaleY
			);
			uv.push(
				1, uvStart / uvScaleY,
				1, uvEnd / uvScaleY,
				0, uvEnd / uvScaleY
			);
		}

		return {position, uv};
	}

	private static getControlPoints(vertices: Vec2[], isClosed: boolean, width: number): Vec2[][] {
		const controlPoints: Vec2[][] = [];

		for (let i = 0; i < vertices.length; i++) {
			const current = vertices[i];
			let prev = vertices[i - 1];
			let next = vertices[i + 1];

			if (isClosed) {
				if (!prev) {
					prev = vertices[vertices.length - 1];
				}
				if (!next) {
					next = vertices[0];
				}
			}

			let vA: Vec2, vB: Vec2;

			if (prev) {
				vA = Vec2.sub(current, prev);
			}
			if (next) {
				vB = Vec2.sub(next, current);
			}

			if (!vA) vA = Vec2.clone(vB);
			if (!vB) vB = Vec2.clone(vA);

			const aNorm = Vec2.normalize(vA);
			const bNorm = Vec2.normalize(vB);

			const leftA = Vec2.rotateLeft(aNorm);
			const leftB = Vec2.rotateLeft(bNorm);
			const alpha = Math.atan2(bNorm.y, bNorm.x) - Math.atan2(aNorm.y, aNorm.x);
			const alphaFixed = alpha < 0 ? alpha + Math.PI * 2 : alpha;
			const offsetDir = Vec2.normalize(Vec2.add(leftA, leftB));
			const offsetLength = width / (2 * Math.cos(alpha / 2));
			const offsetLengthAbs = (!prev && !next) ? width / 2 : Math.min(Math.abs(offsetLength), width * 5);

			const inverse = alphaFixed >= Math.PI;

			const pointLeft = Vec2.add(current, Vec2.multiplyScalar(offsetDir, offsetLengthAbs));
			const pointRight = Vec2.add(current, Vec2.multiplyScalar(offsetDir, -offsetLengthAbs));

			const mirroredA = this.reflectPoint(inverse ? pointRight : pointLeft, current, Vec2.add(current, aNorm));
			const mirroredB = this.reflectPoint(inverse ? pointRight : pointLeft, current, Vec2.add(current, bNorm));

			const p0 = inverse ? mirroredB : pointLeft;
			const p1 = inverse ? pointRight : mirroredB;
			const p2 = inverse ? mirroredA : pointLeft;
			const p3 = inverse ? pointRight : mirroredA;
			const p4 = inverse ? pointLeft : pointRight;

			if (!prev || !next) {
				controlPoints.push([p0, p1, p2, p3]);
			} else {
				controlPoints.push([p0, p1, p2, p3, p4]);
			}
		}

		return controlPoints;
	}

	private static calculateSlope(lineStart: Vec2, lineEnd: Vec2): number {
		return (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x);
	}

	private static calculateYIntercept(lineStart: Vec2, lineEnd: Vec2): number {
		return (lineEnd.x * lineStart.y - lineStart.x * lineEnd.y) / (lineEnd.x - lineStart.x)
	}

	private static reflectPoint(point: Vec2, lineStart: Vec2, lineEnd: Vec2): Vec2 {
		if (lineEnd.x - lineStart.x === 0) {
			return new Vec2(2 * lineEnd.x - point.x, point.y);
		}

		const m = this.calculateSlope(lineStart, lineEnd);
		const c = this.calculateYIntercept(lineStart, lineEnd);
		const d = (point.x + (point.y - c) * m) / (1 + m * m);

		return new Vec2(
			2 * d - point.x,
			2 * d * m - point.y + 2 * c
		);
	}
}