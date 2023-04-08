import MathUtils from "~/lib/math/MathUtils";
import TerrainHeightLoader from "~/app/terrain/TerrainHeightLoader";
import Vec2 from "~/lib/math/Vec2";

export default class TerrainHeightProvider {
	public readonly heightLoader: TerrainHeightLoader;
	private readonly requestZoom: number;
	private readonly bitmapZoom: number;

	public constructor(requestZoom: number, bitmapZoom: number) {
		this.heightLoader = new TerrainHeightLoader();
		this.requestZoom = requestZoom;
		this.bitmapZoom = bitmapZoom;
	}

	private getHeightTexel(tileX: number, tileY: number, texelX: number, texelY: number, applyMercatorScale: boolean): number {
		const resolution = 256;

		if (texelX < 0) {
			texelX = resolution - 1;
			tileX--;
		}
		if (texelX >= resolution) {
			texelX = 0;
			tileX++;
		}
		if (texelY < 0) {
			texelY = resolution - 1;
			tileY--;
		}
		if (texelY >= resolution) {
			texelY = 0;
			tileY++;
		}

		const level = this.bitmapZoom - this.requestZoom;
		const bitmap = this.heightLoader.getBitmap(tileX, tileY, this.requestZoom, level);

		if (!bitmap) {
			return null;
		}

		let height = bitmap.fetchNearest(texelX, texelY);

		if (applyMercatorScale) {
			height *= MathUtils.getMercatorScaleFactorForTile(tileX, tileY, this.requestZoom);
		}

		return height;
	}

	public getHeightGlobalInterpolated(x: number, y: number, applyMercatorScale: boolean): number {
		const tilePosition = MathUtils.meters2tile(x, y, this.requestZoom);

		const tileX = Math.floor(tilePosition.x);
		const tileY = Math.floor(tilePosition.y);

		const tileXOffset = tilePosition.x - tileX;
		const tileYOffset = tilePosition.y - tileY;

		const tileResolution = 256;

		const texelX = tileXOffset * tileResolution;
		const texelY = tileYOffset * tileResolution - 1;
		const texelXFloor = Math.floor(texelX);
		const texelYFloor = Math.floor(texelY);
		const texelXFract = texelX - texelXFloor;
		const texelYFract = texelY - texelYFloor;

		const isEven = (texelXFloor + texelYFloor) % 2 === 0;

		const trianglesList = [
			[0, 0, 1, 0, 0, 1],
			[1, 1, 1, 0, 0, 1],
			[0, 0, 0, 1, 1, 1],
			[0, 0, 1, 0, 1, 1],
		];
		let triangles: number[];

		if (isEven) {
			if (texelXFract + texelYFract < 1) {
				triangles = trianglesList[0];
			} else {
				triangles = trianglesList[1];
			}
		} else {
			if (texelYFract > texelXFract) {
				triangles = trianglesList[2];
			} else {
				triangles = trianglesList[3];
			}
		}

		const aHeight = this.getHeightTexel(
			tileX, tileY, texelXFloor + triangles[0], texelYFloor + triangles[1], applyMercatorScale
		);
		const bHeight = this.getHeightTexel(
			tileX, tileY, texelXFloor + triangles[2], texelYFloor + triangles[3], applyMercatorScale
		);
		const cHeight = this.getHeightTexel(
			tileX, tileY, texelXFloor + triangles[4], texelYFloor + triangles[5], applyMercatorScale
		);

		if (aHeight === null || bHeight === null || cHeight === null) {
			return null;
		}

		const weights = MathUtils.getBarycentricCoordinatesOfPoint(
			new Vec2(texelXFract, texelYFract),
			triangles
		);

		return aHeight * weights.x + bHeight * weights.y + cHeight * weights.z;
	}
}