import Way3D from "../features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "./RoofBuilder";
import Utils from "../../../Utils";
import MathUtils from "~/lib/math/MathUtils";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";

export default class SkillionRoofBuilder implements RoofBuilder {
	public build(way: Way3D): RoofGeometry {
		const footprint = way.triangulateFootprint();
		const rotation = -MathUtils.toRad(+way.tags.roofDirection || 0) - Math.PI / 2;
		const roofHeight = (+way.tags.roofHeight || 8) * way.heightFactor;
		const minHeight = way.minGroundHeight + (+way.tags.height || 6) * way.heightFactor - roofHeight;

		const min = {
			x: Infinity,
			z: Infinity
		};
		const max = {
			x: -Infinity,
			z: -Infinity
		};

		for (let i = 0; i < footprint.positions.length; i += 3) {
			const x = footprint.positions[i];
			const z = footprint.positions[i + 2];
			const v = Vec2.rotate(new Vec2(x, z), rotation);

			min.x = Math.min(min.x, v.x);
			min.z = Math.min(min.z, v.y);
			max.x = Math.max(max.x, v.x);
			max.z = Math.max(max.z, v.y);
		}

		for (let i = 0; i < footprint.positions.length; i += 3) {
			const x = footprint.positions[i];
			const z = footprint.positions[i + 2];
			const v = Vec2.rotate(new Vec2(x, z), rotation);

			const y = (v.y - min.z) / (max.z - min.z);
			footprint.positions[i + 1] = minHeight + y * roofHeight;
		}


		const a = new Vec3(footprint.positions[0], footprint.positions[1], footprint.positions[2]);
		const b = new Vec3(footprint.positions[3], footprint.positions[4], footprint.positions[5]);
		const c = new Vec3(footprint.positions[6], footprint.positions[7], footprint.positions[8]);
		const normal = MathUtils.calculateNormal(a, b, c);

		for (let i = 0; i < footprint.normals.length; i += 3) {
			footprint.normals[i] = normal.x;
			footprint.normals[i + 1] = normal.y;
			footprint.normals[i + 2] = normal.z;
		}

		const vertexCount = footprint.positions.length / 3;

		return {
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs,
			textureId: Utils.fillTypedArraySequence(new Uint8Array(vertexCount), new Uint8Array([0]))
		};
	}
}