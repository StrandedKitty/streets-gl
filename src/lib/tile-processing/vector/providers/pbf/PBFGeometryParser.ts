import {Point} from "~/lib/tile-processing/vector/providers/pbf/types";

export type PBFPoint = [number, number];
export type PBFRing = PBFPoint[];
export type PBFPolygon = PBFRing[];

const MoveToCommand = 1;
const LineToCommand = 2;
const ClosePathCommand = 7;

export default class PBFGeometryParser {
	public static convertCommandsToPoints(arr: number[], extent: number, tileSize: number): Point[] {
		const points: Point[] = [];
		let last: Point = [0, 0];

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

	public static convertCommandsToLineString(arr: number[], extent: number, tileSize: number): Point[][] {
		const lines: Point[][] = [];
		let currentLine: Point[] = [];
		let last: Point = [0, 0];

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
					last = point;
					currentLine.push(point);
				}
			}
		}

		return lines;
	}

	public static convertCommandsToPolygon(arr: number[], extent: number, tileSize: number): Point[][] {
		const polygon: Point[][] = [];
		let currentRing: Point[] = [];
		let start: Point = [0, 0];
		let last: Point = [0, 0];

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

	private static parseCoordinates(x: number, y: number, extent: number, tileSize: number): Point {
		const px = this.zigzagDecode(x) / (extent - 1);
		const py = this.zigzagDecode(y) / (extent - 1);
		return [px * tileSize, py * tileSize];
	}

	private static zigzagDecode(n: number): number {
		return (n >>> 1) ^ -(n & 1);
	}
}