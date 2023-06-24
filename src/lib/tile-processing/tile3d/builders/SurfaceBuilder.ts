import Vec2 from "~/lib/math/Vec2";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";

export enum SurfaceBuilderOrientation {
	Along,
	Across
}

export default class SurfaceBuilder {
	public static build(
		{
			multipolygon,
			isOriented,
			stretch,
			orientation,
			uvScale
		}: {
			multipolygon: Tile3DMultipolygon;
			isOriented: boolean;
			stretch: boolean;
			orientation: SurfaceBuilderOrientation;
			uvScale: number;
		}
	): {position: number[]; uv: number[]; normal: number[]} {
		const footprint = multipolygon.getFootprint({
			height: 0,
			flip: false
		});

		if (isOriented) {
			const ombb = multipolygon.getOMBB();

			const ombbOrigin = ombb[1];
			let rotVector0 = Vec2.sub(ombb[0], ombbOrigin);
			let rotVector1 = Vec2.sub(ombb[2], ombbOrigin);
			let rotVector0Length = Vec2.getLength(rotVector0);
			let rotVector1Length = Vec2.getLength(rotVector1);

			let needsFlip: boolean = false;

			if (orientation === SurfaceBuilderOrientation.Along) {
				needsFlip = rotVector0Length > rotVector1Length;
			} else {
				needsFlip = rotVector0Length < rotVector1Length;
			}

			if (needsFlip) {
				[rotVector0, rotVector1] = [rotVector1, rotVector0];
				[rotVector0Length, rotVector1Length] = [rotVector1Length, rotVector0Length];
			}

			const angle = -Vec2.angleClockwise(new Vec2(1, 0), rotVector0);
			const scaleVec = new Vec2(1 / rotVector0Length, 1 / rotVector1Length);

			for (let i = 0; i < footprint.uvs.length; i += 2) {
				const x = footprint.uvs[i];
				const y = footprint.uvs[i + 1];

				const rotated = Vec2.rotate(Vec2.sub(new Vec2(x, y), ombbOrigin), angle);
				const scaled = new Vec2(rotated.x, rotated.y);

				if (stretch) {
					scaled.x *= scaleVec.x;
					scaled.y *= scaleVec.y;
				}

				footprint.uvs[i] = scaled.x;
				footprint.uvs[i + 1] = -scaled.y;
			}
		}

		for (let i = 0; i < footprint.uvs.length; i++) {
			footprint.uvs[i] /= uvScale;
		}

		return {
			position: footprint.positions,
			uv: footprint.uvs,
			normal: footprint.normals
		};
	}
}