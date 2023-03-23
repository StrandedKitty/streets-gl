import Vec2 from "~/lib/math/Vec2";

export enum RoadSide {
	Both,
	Left,
	Right
}

export default class RoadBuilder {
	public static build(
		{
			vertices,
			vertexAdjacentToStart,
			vertexAdjacentToEnd,
			width,
			uvFollowRoad,
			uvScale = 1,
			uvScaleY = 1,
			side = RoadSide.Both,
			uvMinX = 0,
			uvMaxX = 1
		}: {
			vertices: Vec2[];
			vertexAdjacentToStart?: Vec2;
			vertexAdjacentToEnd?: Vec2;
			width: number;
			uvFollowRoad: boolean;
			uvScale?: number;
			uvScaleY?: number;
			side?: RoadSide;
			uvMinX?: number;
			uvMaxX?: number;
		}
	): {position: number[]; uv: number[]; border: Vec2[]} {
		const isClosed = vertices[0].equals(vertices[vertices.length - 1]);
		const points = [...vertices];

		if (isClosed) {
			points.pop();
		}

		const controlPoints = this.getControlPoints(points, isClosed, width, vertexAdjacentToStart, vertexAdjacentToEnd);
		const border = this.getBorderVertices(controlPoints, isClosed);
		const geometry = this.buildSegmentsFromControlPoints(
			controlPoints,
			isClosed,
			uvScaleY,
			uvMinX,
			uvMaxX,
			side);

		if (!uvFollowRoad) {
			this.fillUVsFromPositions(geometry.uv, geometry.position, uvScale);
		}

		return {
			position: geometry.position,
			uv: geometry.uv,
			border: border
		};
	}

	private static getBorderVertices(controlPoints: Vec2[][], isClosed: boolean): Vec2[] {
		const segmentCount = controlPoints.length - (isClosed ? 0 : 1);
		const border: Vec2[] = [];

		for (let i = 0; i < segmentCount; i++) {
			const current = controlPoints[i];
			const next = controlPoints[(i + 1) % controlPoints.length];

			if (current[4]) {
				const inverse = current[2].equals(current[0]);

				if (inverse) {
					border.unshift(current[4]);
				} else {
					border.push(current[4]);
				}
			}

			border.push(current[0], next[2]);
			border.unshift(next[3], current[1]);
		}

		border.push(border[0]);

		return border;
	}

	private static buildConnectionAttributesStart(
		controlPoint: Vec2[],
		side: RoadSide,
		start: number,
		end: number,
		isInverse: boolean,
		uvMinX: number,
		uvMaxX: number,
		uvScaleY: number,
		position: number[],
		uv: number[]
	): void {
		if (side === RoadSide.Both) {
			const c0uv = [uvMinX, end / uvScaleY];
			const c1uv = [uvMaxX, end / uvScaleY];
			const c4uv = [isInverse ? uvMaxX : uvMinX, start / uvScaleY];

			position.push(
				controlPoint[0].x, 0, controlPoint[0].y,
				controlPoint[1].x, 0, controlPoint[1].y,
				controlPoint[4].x, 0, controlPoint[4].y
			);
			uv.push(
				...c0uv,
				...c1uv,
				...c4uv
			);

			return;
		}

		const uvMidX = (uvMinX + uvMaxX) / 2;
		const midEnd = Vec2.multiplyScalar(Vec2.add(controlPoint[0], controlPoint[1]), 0.5);
		const midCenter = isInverse ?
			Vec2.multiplyScalar(Vec2.add(controlPoint[2], controlPoint[4]), 0.5) :
			Vec2.multiplyScalar(Vec2.add(controlPoint[1], controlPoint[4]), 0.5);

		const midEndUV = [uvMidX, end / uvScaleY];
		const midCenterUV = [uvMidX, ((start + end) / 2) / uvScaleY];

		const c0uv = [uvMinX, end / uvScaleY];
		const c1uv = [uvMaxX, end / uvScaleY];
		const c4uv = [isInverse ? uvMaxX : uvMinX, start / uvScaleY];

		const clipLeft = side === RoadSide.Left;

		if (clipLeft === isInverse) {
			position.push(
				midCenter.x, 0, midCenter.y,
				midEnd.x, 0, midEnd.y,
				controlPoint[4].x, 0, controlPoint[4].y
			);
			const t2 = !isInverse ? controlPoint[0] : controlPoint[1];
			const t2uv = !isInverse ? c0uv : c1uv;
			position.push(
				midEnd.x, 0, midEnd.y,
				t2.x, 0, t2.y,
				controlPoint[4].x, 0, controlPoint[4].y
			);

			uv.push(
				...midCenterUV,
				...midEndUV,
				...c4uv,

				...midEndUV,
				...t2uv,
				...c4uv
			);
		} else {
			const t = !isInverse ? controlPoint[1] : controlPoint[0];
			const tuv = !isInverse ? c1uv : c0uv;
			position.push(
				midCenter.x, 0, midCenter.y,
				t.x, 0, t.y,
				midEnd.x, 0, midEnd.y
			);
			uv.push(
				...midCenterUV,
				...tuv,
				...midEndUV
			);
		}
	}

	private static buildConnectionAttributesEnd(
		controlPoint: Vec2[],
		side: RoadSide,
		start: number,
		end: number,
		isInverse: boolean,
		uvMinX: number,
		uvMaxX: number,
		uvScaleY: number,
		position: number[],
		uv: number[]
	): void {
		if (side === RoadSide.Both) {
			const c2uv = [uvMinX, start / uvScaleY];
			const c3uv = [uvMaxX, start / uvScaleY];
			const c4uv = [isInverse ? uvMaxX : uvMinX, end / uvScaleY];

			position.push(
				controlPoint[2].x, 0, controlPoint[2].y,
				controlPoint[3].x, 0, controlPoint[3].y,
				controlPoint[4].x, 0, controlPoint[4].y
			);
			uv.push(
				...c2uv,
				...c3uv,
				...c4uv
			);

			return;
		}

		const uvMidX = (uvMinX + uvMaxX) / 2;
		const midStart = Vec2.multiplyScalar(Vec2.add(controlPoint[2], controlPoint[3]), 0.5);
		const midCenter = isInverse ?
			Vec2.multiplyScalar(Vec2.add(controlPoint[2], controlPoint[4]), 0.5) :
			Vec2.multiplyScalar(Vec2.add(controlPoint[1], controlPoint[4]), 0.5);

		const midStartUV = [uvMidX, start / uvScaleY];
		const midCenterUV = [uvMidX, ((start + end) / 2) / uvScaleY];

		const c2uv = [uvMinX, start / uvScaleY];
		const c3uv = [uvMaxX, start / uvScaleY];
		const c4uv = [isInverse ? uvMaxX : uvMinX, end / uvScaleY];

		const clipLeft = side === RoadSide.Left;

		if (clipLeft === isInverse) {
			position.push(
				midStart.x, 0, midStart.y,
				midCenter.x, 0, midCenter.y,
				controlPoint[4].x, 0, controlPoint[4].y
			);
			const t1 = !isInverse ? controlPoint[2] : controlPoint[3];
			const t1uv = !isInverse ? c2uv : c3uv;
			position.push(
				midStart.x, 0, midStart.y,
				controlPoint[4].x, 0, controlPoint[4].y,
				t1.x, 0, t1.y
			);

			uv.push(
				...midStartUV,
				...midCenterUV,
				...c4uv,

				...midStartUV,
				...c4uv,
				...t1uv
			);
		} else {
			const t = !isInverse ? controlPoint[3] : controlPoint[2];
			const tuv = !isInverse ? c3uv : c2uv;
			position.push(
				midStart.x, 0, midStart.y,
				t.x, 0, t.y,
				midCenter.x, 0, midCenter.y
			);

			uv.push(
				...midStartUV,
				...tuv,
				...midCenterUV,
			);
		}
	}

	private static buildConnection(
		controlPoint: Vec2[],
		side: RoadSide,
		uvProgress: number,
		uvMinX: number,
		uvMaxX: number,
		uvScaleY: number,
		position: number[],
		uv: number[],
		type: 'start' | 'end'
	): number {
		if (!controlPoint[4]) {
			return uvProgress;
		}

		const isInverse = controlPoint[2].equals(controlPoint[0]);
		const triLength = Vec2.getLength(Vec2.sub(controlPoint[4], !isInverse ? controlPoint[0] : controlPoint[1]));

		const start = uvProgress;
		const end = start + triLength;

		if (type === 'start') {
			this.buildConnectionAttributesStart(
				controlPoint,
				side,
				start,
				end,
				isInverse,
				uvMinX,
				uvMaxX,
				uvScaleY,
				position,
				uv
			);
		} else {
			this.buildConnectionAttributesEnd(
				controlPoint,
				side,
				start,
				end,
				isInverse,
				uvMinX,
				uvMaxX,
				uvScaleY,
				position,
				uv
			);
		}

		return end;
	}

	private static buildSegment(
		controlPointFrom: Vec2[],
		controlPointTo: Vec2[],
		side: RoadSide,
		uvProgress: number,
		uvMinX: number,
		uvMaxX: number,
		uvScaleY: number,
		position: number[],
		uv: number[],
	): number {
		const a = controlPointFrom[0];
		const b = controlPointFrom[1];
		const c = controlPointTo[2];
		const d = controlPointTo[3];

		const segmentLength = Vec2.getLength(Vec2.sub(a, c));
		const uvStart = uvProgress;
		const uvEnd = uvProgress + segmentLength;

		if (side === RoadSide.Both) {
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
				uvMinX, uvStart / uvScaleY,
				uvMaxX, uvStart / uvScaleY,
				uvMinX, uvEnd / uvScaleY
			);
			uv.push(
				uvMaxX, uvStart / uvScaleY,
				uvMaxX, uvEnd / uvScaleY,
				uvMinX, uvEnd / uvScaleY
			);
		} else {
			const midStart = Vec2.multiplyScalar(Vec2.add(c, d), 0.5);
			const midEnd = Vec2.multiplyScalar(Vec2.add(a, b), 0.5);
			const uvMidX = (uvMinX + uvMaxX) / 2;

			if (side === RoadSide.Left) {
				position.push(
					b.x, 0, b.y,
					midEnd.x, 0, midEnd.y,
					d.x, 0, d.y
				);
				position.push(
					midEnd.x, 0, midEnd.y,
					midStart.x, 0, midStart.y,
					d.x, 0, d.y
				);

				uv.push(
					uvMaxX, uvStart / uvScaleY,
					uvMidX, uvStart / uvScaleY,
					uvMaxX, uvEnd / uvScaleY
				);
				uv.push(
					uvMidX, uvStart / uvScaleY,
					uvMidX, uvEnd / uvScaleY,
					uvMaxX, uvEnd / uvScaleY
				);
			} else {
				position.push(
					a.x, 0, a.y,
					midEnd.x, 0, midEnd.y,
					c.x, 0, c.y
				);
				position.push(
					midEnd.x, 0, midEnd.y,
					midStart.x, 0, midStart.y,
					c.x, 0, c.y
				);

				uv.push(
					uvMinX, uvStart / uvScaleY,
					uvMidX, uvStart / uvScaleY,
					uvMinX, uvEnd / uvScaleY
				);
				uv.push(
					uvMidX, uvStart / uvScaleY,
					uvMidX, uvEnd / uvScaleY,
					uvMinX, uvEnd / uvScaleY
				);
			}
		}

		return uvEnd;
	}

	private static buildSegmentsFromControlPoints(
		controlPoints: Vec2[][],
		isClosed: boolean,
		uvScaleY: number,
		uvMinX: number,
		uvMaxX: number,
		side: RoadSide,
	): {position: number[]; uv: number[]} {
		const position: number[] = [];
		const uv: number[] = [];

		const segmentCount = controlPoints.length - (isClosed ? 0 : 1);
		let uvProgress = 0;

		for (let i = 0; i < segmentCount; i++) {
			const current = controlPoints[i];
			const next = controlPoints[(i + 1) % controlPoints.length];

			uvProgress = this.buildConnection(
				current,
				side,
				uvProgress,
				uvMinX,
				uvMaxX,
				uvScaleY,
				position,
				uv,
				'start'
			);

			uvProgress = this.buildSegment(
				current,
				next,
				side,
				uvProgress,
				uvMinX,
				uvMaxX,
				uvScaleY,
				position,
				uv,
			);

			uvProgress = this.buildConnection(
				next,
				side,
				uvProgress,
				uvMinX,
				uvMaxX,
				uvScaleY,
				position,
				uv,
				'end'
			);
		}

		return {position, uv};
	}

	private static fillUVsFromPositions(uv: number[], position: number[], scale: number): void {
		for (let i = 0, j = 0; i < uv.length; i += 2, j += 3) {
			const px = position[j];
			const pz = position[j + 2];

			uv[i] = px / scale;
			uv[i + 1] = pz / scale;
		}
	}

	private static getControlPoints(
		vertices: Vec2[],
		isClosed: boolean,
		width: number,
		vertexAdjacentToStart?: Vec2,
		vertexAdjacentToEnd?: Vec2
	): Vec2[][] {
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
			} else {
				if (!prev && vertexAdjacentToStart) {
					prev = vertexAdjacentToStart;
				}
				if (!next && vertexAdjacentToEnd) {
					next = vertexAdjacentToEnd;
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