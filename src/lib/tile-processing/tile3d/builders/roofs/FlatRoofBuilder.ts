import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";

export default class FlatRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, minHeight, flip} = params;

		const footprint = multipolygon.getFootprint({
			height: minHeight,
			flip: flip
		});

		return {
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs,
			addSkirt: false
		};
	}
}