import Vec2 from "~/lib/math/Vec2";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";

export default class CameraViewport {
	public min: Vec2 = new Vec2();
	public max: Vec2 = new Vec2();
	public zoom: number = 0;

	public setFromPerspectiveCamera(camera: PerspectiveCamera): void {
		const projectionHeight = Math.tan(MathUtils.toRad(camera.fov / 2)) * camera.position.y * 2;
		const projectionWidth = projectionHeight * camera.aspect;
		const min = MathUtils.meters2tile(
			camera.position.x + projectionHeight / 2,
			camera.position.z - projectionWidth / 2,
			0
		);
		const max = MathUtils.meters2tile(
			camera.position.x - projectionHeight / 2,
			camera.position.z + projectionWidth / 2,
			0
		);

		const projectionHeightNorm = projectionHeight / (20037508.34 * 2);

		if (projectionHeightNorm === 0) {
			this.zoom = 0;
		} else {
			this.zoom = Math.log2(1 / projectionHeightNorm) + 2;
		}

		this.zoom = MathUtils.clamp(this.zoom, 0, 16);

		this.min.set(min.x, min.y);
		this.max.set(max.x, max.y);
	}

	public getVisibleTiles(): Vec2[] {
		const tiles: Vec2[] = [];
		const size = 2 ** Math.floor(this.zoom);

		const minX = Math.floor(this.min.x * size);
		const maxX = Math.floor(this.max.x * size);
		const minY = Math.floor(this.min.y * size);
		const maxY = Math.floor(this.max.y * size);

		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				if (x < 0 || y < 0 || x >= size || y >= size) {
					continue;
				}

				tiles.push(new Vec2(x, y));
			}
		}

		return tiles;
	}
}