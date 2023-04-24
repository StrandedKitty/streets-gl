import OrthographicCamera from "~/lib/core/OrthographicCamera";
import Vec2 from "~/lib/math/Vec2";

export default class CameraViewport {
	public min: Vec2 = new Vec2();
	public max: Vec2 = new Vec2();
	public zoom: number = 0;

	public setFromOrthographicCamera(camera: OrthographicCamera): void {
		const minX = camera.position.x + camera.left;
		const maxX = camera.position.x + camera.right;
		const minY = (1 - camera.position.y) - camera.top;
		const maxY = (1 - camera.position.y) - camera.bottom;

		this.zoom = Math.log2(1 / Math.abs(camera.top - camera.bottom)) + 2;

		this.min.set(minX, minY);
		this.max.set(maxX, maxY);
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