import Vec2 from "../../../math/Vec2";
import Vec3 from "../../../math/Vec3";

export default class RoadPolylineBuilder {
	public static build(sourcePoints: Vec2[], width: number): {positions: Float32Array; uvs: Float32Array} {
		const extrudedPoints: Vec2[][] = [];
		const positions: number[] = [];
		const uvs: number[] = [];
		//const points = Simplify(sourcePoints, 1, false).map(p => new Vec2(p.x, p.y));
		const points = sourcePoints;

		const isClosed = points[0].equals(points[points.length - 1]);

		for (let i = 0; i < points.length - (isClosed ? 1 : 0); i++) {
			const prev = points[i - 1] || (isClosed && points[points.length - 2]);
			const current = points[i];
			const next = points[i + 1];

			const noPrev = !prev;
			const noNext = !next;

			let vA, vB;

			if (prev) {
				vA = Vec2.sub(current, prev);
			}

			if (next) {
				vB = Vec2.sub(next, current);
			}

			if (!vA) vA = Vec2.copy(vB);
			if (!vB) vB = Vec2.copy(vA);

			const aNorm = Vec2.normalize(vA);
			const bNorm = Vec2.normalize(vB);

			const leftA = Vec2.rotateLeft(aNorm);
			const leftB = Vec2.rotateLeft(bNorm);
			const alpha = Math.atan2(bNorm.y, bNorm.x) - Math.atan2(aNorm.y, aNorm.x);
			const alphaFixed = alpha < 0 ? alpha + Math.PI * 2 : alpha;
			const offsetDir = Vec2.normalize(Vec2.add(leftA, leftB));
			const offsetLength = width / (2 * Math.cos(alpha / 2));
			const offsetLengthAbs = (noPrev || noNext) ? width / 2 : Math.min(Math.abs(offsetLength), width * 5);

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

			if (noPrev || noNext) {
				extrudedPoints.push([p0, p1, p2, p3]);
			} else {
				extrudedPoints.push([p0, p1, p2, p3, p4]);
			}
		}

		let uvProgress = 0;

		for (let i = 0; i < extrudedPoints.length - (isClosed ? 0 : 1); i++) {
			const current = extrudedPoints[i];
			const next = extrudedPoints[(i + 1) % extrudedPoints.length];

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

				positions.push(...Vec3.toArray(this.vec2ToVec3(a)), ...Vec3.toArray(this.vec2ToVec3(b)), ...Vec3.toArray(this.vec2ToVec3(current[4])));
				positions.push(...Vec3.toArray(this.vec2ToVec3(current[2])), ...Vec3.toArray(this.vec2ToVec3(current[3])), ...Vec3.toArray(this.vec2ToVec3(current[4])));

				uvs.push(0, endB, 1, endB, inverse ? 1 : 0, startB);
				uvs.push(0, startA, 1, startA, inverse ? 1 : 0, endA);

				uvProgress = endB;
			}

			const segmentLength = Vec2.getLength(Vec2.sub(a, c));
			const uvStart = uvProgress;
			const uvEnd = uvProgress + segmentLength;

			uvProgress = uvEnd;

			positions.push(...Vec3.toArray(this.vec2ToVec3(a)), ...Vec3.toArray(this.vec2ToVec3(b)), ...Vec3.toArray(this.vec2ToVec3(c)));
			positions.push(...Vec3.toArray(this.vec2ToVec3(b)), ...Vec3.toArray(this.vec2ToVec3(d)), ...Vec3.toArray(this.vec2ToVec3(c)));

			uvs.push(0, uvStart, 1, uvStart, 0, uvEnd);
			uvs.push(1, uvStart, 1, uvEnd, 0, uvEnd);
		}

		return {
			positions: new Float32Array(positions),
			uvs: new Float32Array(uvs),
		};
	}

	private static vec2ToVec3(vec2: Vec2): Vec3 {
		return new Vec3(vec2.x, 100, vec2.y);
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