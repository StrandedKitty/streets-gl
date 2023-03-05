import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";
import Vec2 from "~/lib/math/Vec2";

export default class FlatRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, minHeight, flip} = params;

		const footprint = multipolygon.getFootprint({
			height: minHeight,
			flip: flip
		});
		const ombb = multipolygon.getOMBB();

		const ombbOrigin = ombb[1];
		const rotVector0 = Vec2.sub(ombb[0], ombbOrigin);
		const rotVector1 = Vec2.sub(ombb[2], ombbOrigin);
		const angle = -Vec2.angleClockwise(new Vec2(1, 0), rotVector0);

		const ombbScaleFactor = params.isStretched ?
			new Vec2(Vec2.getLength(rotVector0), Vec2.getLength(rotVector1)) :
			new Vec2(params.scaleX, params.scaleY);

		for (let i = 0; i < footprint.uvs.length; i += 2) {
			const x = footprint.uvs[i];
			const y = footprint.uvs[i + 1];
			const rotated = Vec2.rotate(Vec2.sub(new Vec2(x, y), ombbOrigin), angle);

			footprint.uvs[i] = rotated.x / ombbScaleFactor.x;
			footprint.uvs[i + 1] = rotated.y / ombbScaleFactor.y;
		}

		return {
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs,
			addSkirt: false
		};
	}
}