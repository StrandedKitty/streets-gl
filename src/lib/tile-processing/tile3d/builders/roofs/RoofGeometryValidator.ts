import {RoofGeometry} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";

export default class RoofGeometryValidator {
	public static validate(roof: RoofGeometry, multipolygon: Tile3DMultipolygon): boolean {
		if (roof.canExtendOutsideFootprint) {
			return true;
		}

		const aabb = multipolygon.getAABB();
		const padding = new Vec2(0.01);
		aabb.includePoint(Vec2.sub(aabb.min, padding));
		aabb.includePoint(Vec2.add(aabb.max, padding));

		for (let i = 0; i < roof.position.length; i += 3) {
			const point = new Vec2(roof.position[i], roof.position[i + 2]);

			if (!aabb.includesPoint(point)) {
				return false;
			}
		}

		return true;
	}
}
