import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export type PBFPoint = [number, number];
export type PBFRing = PBFPoint[];
export type PBFPolygon = PBFRing[];

const MoveToCommand = 1;
const LineToCommand = 2;
const ClosePathCommand = 7;

export default class PBFGeometryParser {
	public static convertCommandsToPoints(arr: number[], extent: number, tileSize: number): VectorTile.Point[] {
		const points: VectorTile.Point[] = [];
		let last: VectorTile.Point = [0, 0];

		for (let i = 0; i < arr.length; i++) {
			const command = arr[i] & 0b111;
			const param = arr[i] >> 3;

			if (command === MoveToCommand) {
				for (let j = 0; j < param; j++) {
					i += 2;
					const point = this.parseCoordinates(arr[i - 1], arr[i], extent, tileSize);
					point[0] += last[0];
					point[1] += last[1];

					points.push(point);

					last = point;
				}
			}
		}

		return points;
	}

	public static convertCommandsToLineString(arr: number[], extent: number, tileSize: number): VectorTile.Point[][] {
		const lines: VectorTile.Point[][] = [];
		let currentLine: VectorTile.Point[] = [];
		let last: VectorTile.Point = [0, 0];

		for (let i = 0; i < arr.length; i++) {
			const command = arr[i] & 0b111;
			const param = arr[i] >> 3;

			if (command === MoveToCommand) {
				currentLine = [];
				lines.push(currentLine);

				for (let j = 0; j < param; j++) {
					i += 2;
					const point = this.parseCoordinates(arr[i - 1], arr[i], extent, tileSize);
					point[0] += last[0];
					point[1] += last[1];
					currentLine.push(point);
					last = point;
				}
			} else if (command === LineToCommand) {
				for (let j = 0; j < param; j++) {
					i += 2;
					const point = this.parseCoordinates(arr[i - 1], arr[i], extent, tileSize);
					point[0] += last[0];
					point[1] += last[1];

					// Detect closed lines and connect their ends.
					if (
						currentLine.length > 0 &&
						this.distance(currentLine[0], point) < 0.001
					) {
						const start = currentLine[0];

						point[0] = start[0];
						point[1] = start[1];
					}

					last = point;
					currentLine.push(point);
				}
			}
		}

		return lines;
	}

	public static convertCommandsToPolygon(arr: number[], extent: number, tileSize: number): VectorTile.Point[][] {
		const polygon: VectorTile.Point[][] = [];
		let currentRing: VectorTile.Point[] = [];
		let start: VectorTile.Point = [0, 0];
		let last: VectorTile.Point = [0, 0];

		for (let i = 0; i < arr.length; i++) {
			const command = arr[i] & 0b111;
			const param = arr[i] >> 3;

			if (command === MoveToCommand) {
				currentRing = [];
				polygon.push(currentRing);

				for (let j = 0; j < param; j++) {
					i += 2;

					const point = this.parseCoordinates(arr[i - 1], arr[i], extent, tileSize);
					point[0] += last[0];
					point[1] += last[1];

					currentRing.push(point);
					start = point;

					last = point;
				}
			} else if (command === LineToCommand) {
				for (let j = 0; j < param; j++) {
					i += 2;

					const point = this.parseCoordinates(arr[i - 1], arr[i], extent, tileSize);
					point[0] += last[0];
					point[1] += last[1];

					currentRing.push(point);
					last = point;
				}
			} else if (command === ClosePathCommand) {
				currentRing.push([...start]);
			}
		}

		return polygon;
	}

	private static parseCoordinates(x: number, y: number, extent: number, tileSize: number): VectorTile.Point {
		const px = this.zigzagDecode(x) / (extent - 1);
		const py = this.zigzagDecode(y) / (extent - 1);
		return [px * tileSize, py * tileSize];
	}

	private static zigzagDecode(n: number): number {
		return (n >>> 1) ^ -(n & 1);
	}

	private static distance(a: VectorTile.Point, b: VectorTile.Point): number {
		const dx = a[0] - b[0];
		const dy = a[1] - b[1];
		return Math.sqrt(dx * dx + dy * dy);
	}
}