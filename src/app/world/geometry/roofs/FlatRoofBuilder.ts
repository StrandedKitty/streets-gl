import Way3D from "../features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "./RoofBuilder";
import Config from "../../../Config";
import Utils from "../../../Utils";

export default class FlatRoofBuilder implements RoofBuilder {
	public build(way: Way3D): RoofGeometry {
		const footprint = way.triangulateFootprint();
		const isFootprintTextured = way.getTotalArea() > Config.MinTexturedRoofArea && way.aabb.getArea() < Config.MaxTexturedRoofAABBArea;
		const textureId = isFootprintTextured ? (way.id % 4 + 1) : 0;
		const vertexCount = footprint.positions.length / 3;

		return {
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs,
			textureId: Utils.fillTypedArraySequence(new Uint8Array(vertexCount), new Uint8Array([textureId]))
		};
	}
}