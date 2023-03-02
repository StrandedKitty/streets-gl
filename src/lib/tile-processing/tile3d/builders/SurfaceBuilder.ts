import Vec2 from "~/lib/math/Vec2";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";

export default class SurfaceBuilder {
	public build(
		{
			multipolygon,
			isOriented,
			uvScale
		}: {
			multipolygon: Tile3DMultipolygon;
			isOriented: boolean;
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

			if (Vec2.getLength(rotVector0) > Vec2.getLength(rotVector1)) {
				[rotVector0, rotVector1] = [rotVector1, rotVector0];
			}

			const angle = -Vec2.angleClockwise(new Vec2(1, 0), rotVector0);

			for (let i = 0; i < footprint.uvs.length; i += 2) {
				const x = footprint.uvs[i];
				const y = footprint.uvs[i + 1];

				const rotated = Vec2.rotate(Vec2.sub(new Vec2(x, y), ombbOrigin), angle);
				const scaled = new Vec2(rotated.x / Vec2.getLength(rotVector0), rotated.y / Vec2.getLength(rotVector1));

				footprint.uvs[i] = scaled.x;
				footprint.uvs[i + 1] = -scaled.y;
			}
		}

		for (let i = 0; i < footprint.uvs.length; i++) {
			footprint.uvs[i] *= uvScale;
		}

		return {
			position: footprint.positions,
			uv: footprint.uvs,
			normal: footprint.normals
		};
	}
	}