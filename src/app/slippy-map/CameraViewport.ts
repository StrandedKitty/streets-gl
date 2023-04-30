import Vec2 from "~/lib/math/Vec2";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import AABB2D from "~/lib/math/AABB2D";

export default class CameraViewport {
	private boundingBox: AABB2D = null;
	private zoom: number = 0;

	public setFromPerspectiveCamera(camera: PerspectiveCamera, groundHeight: number): void {
		const projectionSize = this.getProjectionSize(camera);
		const projectionHeightNorm = projectionSize.y / (20037508.34 * 2);

		if (projectionHeightNorm === 0) {
			this.zoom = 0;
		} else {
			this.zoom = Math.log2(1 / projectionHeightNorm) + 1.5;
		}

		this.zoom = MathUtils.clamp(this.zoom, 0, 16);

		this.boundingBox = this.getCameraProjectionBoundingBox(camera, groundHeight);
	}

	private getProjectionSize(camera: PerspectiveCamera): Vec2 {
		const projectionHeight = Math.tan(MathUtils.toRad(camera.fov / 2)) * camera.position.y * 2;
		const projectionWidth = projectionHeight * camera.aspect;

		return new Vec2(projectionWidth, projectionHeight);
	}

	private getCameraProjectionBoundingBox(camera: PerspectiveCamera, groundHeight: number): AABB2D {
		const box = new AABB2D();
		const projectedPoints: Vec2[] = [
			new Vec2(-1, -1),
			new Vec2(1, -1),
			new Vec2(1, 1),
			new Vec2(-1, 1)
		];

		for (const {x, y} of projectedPoints) {
			const pos = Vec3.unproject(new Vec3(x, y, 0.5), camera, false);
			const vector = Vec3.sub(pos, camera.position);

			const distanceToGround = (camera.position.y - groundHeight) / vector.y;
			const vectorToGround = Vec3.multiplyScalar(vector, distanceToGround);
			const positionOnGround = Vec3.sub(camera.position, vectorToGround);

			const tileSpacePositionOnGround = MathUtils.meters2tile(positionOnGround.x, positionOnGround.z, 0);

			tileSpacePositionOnGround.x = MathUtils.clamp(tileSpacePositionOnGround.x, 0, 1);
			tileSpacePositionOnGround.y = MathUtils.clamp(tileSpacePositionOnGround.y, 0, 1);

			box.includePoint(tileSpacePositionOnGround);
		}

		return box;
	}

	public getVisibleTiles(zoomMin: number, zoomMax: number, padding: number): Vec3[] {
		const tiles: Vec3[] = [];

		if (!this.boundingBox || this.boundingBox.isEmpty) {
			return tiles;
		}

		for (let zoom = zoomMin; zoom <= zoomMax; zoom++) {
			const size = 2 ** zoom;

			const minX = Math.floor(this.boundingBox.min.x * size) - padding;
			const maxX = Math.floor(this.boundingBox.max.x * size) + padding;
			const minY = Math.floor(this.boundingBox.min.y * size) - padding;
			const maxY = Math.floor(this.boundingBox.max.y * size) + padding;

			let i = 0;

			for (let x = minX; x <= maxX; x++) {
				for (let y = minY; y <= maxY; y++) {
					if (x < 0 || y < 0 || x >= size || y >= size) {
						continue;
					}

					tiles.push(new Vec3(x, y, zoom));
					++i;

					if (i > 500) {
						break;
					}
				}
			}
		}

		return tiles;
	}

	public get currentZoom(): number {
		return this.zoom;
	}
}