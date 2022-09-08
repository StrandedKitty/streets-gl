import Way3D from "~/app/world/geometry/features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "~/app/world/geometry/roofs/RoofBuilder";
import Config from "~/app/Config";
import Utils from "~/app/Utils";

export default new class FlatRoofBuilder extends RoofBuilder {
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