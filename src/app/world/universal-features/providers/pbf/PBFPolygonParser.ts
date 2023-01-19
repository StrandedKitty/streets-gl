export type PBFPoint = [number, number];
export type PBFRing = PBFPoint[];
export type PBFPolygon = PBFRing[];

export default class PBFPolygonParser {
	public static convertCommandsToPolygons(arr: number[], tileSize: number): PBFPolygon {
		const polygon: PBFPolygon = [];
		let currentRing: PBFRing = [];
		let start: PBFPoint = [0, 0];
		let last: PBFPoint = [0, 0];

		for (let i = 0; i < arr.length; i++) {
			const command = arr[i] & 0b111;
			const param = arr[i] >> 3;

			if(command === 1) { // MoveTo
				currentRing = [];
				polygon.push(currentRing);

				for(let j = 0; j < param; j++) {
					i += 2;
					const rel = this.parseCoordinates(arr[i - 1], arr[i], tileSize);
					rel[0] += last[0];
					rel[1] += last[1];
					start = [rel[0], rel[1]];
					currentRing.push(rel);
					last = rel;
				}
			} else if(command === 2) { // LineTo
				for(let j = 0; j < param; j++) {
					i += 2;
					const rel = this.parseCoordinates(arr[i - 1], arr[i], tileSize);
					rel[0] += last[0];
					rel[1] += last[1];
					last = rel;
					currentRing.push(rel);
				}
			} else if(command === 7) { // ClosePath
				currentRing.push(start);
			}
		}

		for(let i = 0; i < polygon.length; i++) {
			for(let j = 0; j < polygon[i].length; j++) {
				polygon[i][j][0] = tileSize - polygon[i][j][0];
			}
		}

		return polygon;
	}

	private static parseCoordinates(x: number, y: number, tileSize: number): PBFPoint {
		const px = this.zigzagDecode(y) / 4095;
		const pz = this.zigzagDecode(x) / 4095;
		return [px * tileSize, pz * tileSize];
	}

	private static zigzagDecode(n: number): number {
		return (n >>> 1) ^ -(n & 1);
	}
}