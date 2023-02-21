import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";
import MathUtils from "~/lib/math/MathUtils";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";

export default class SkillionRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, minHeight, height, direction} = params;
		const skirtHeight: number[][] = [];
		const footprint = multipolygon.getFootprint({
			height: minHeight,
			flip: false
		});
		const rotation = -MathUtils.toRad(direction ?? 0) - Math.PI / 2;

		const min = {
			x: Infinity,
			z: Infinity
		};
		const max = {
			x: -Infinity,
			z: -Infinity
		};

		for (const ring of multipolygon.rings) {
			for (const node of ring.nodes) {
				const v = Vec2.rotate(node, rotation);

				min.x = Math.min(min.x, v.x);
				min.z = Math.min(min.z, v.y);
				max.x = Math.max(max.x, v.x);
				max.z = Math.max(max.z, v.y);
			}
		}

		for (let i = 0; i < footprint.positions.length; i += 3) {
			const x = footprint.positions[i];
			const z = footprint.positions[i + 2];
			const v = Vec2.rotate(new Vec2(x, z), rotation);
			const y = (v.y - min.z) / (max.z - min.z);

			footprint.positions[i + 1] = minHeight + y * height;
		}

		for (const ring of multipolygon.rings) {
			const skirt: number[] = [];
			skirtHeight.push(skirt);

			for (const node of ring.nodes) {
				const v = Vec2.rotate(node, rotation);
				const y = (v.y - min.z) / (max.z - min.z);

				const vertexHeight = minHeight + y * height;
				skirt.push(vertexHeight);
			}
		}

		const p0 = new Vec3(footprint.positions[0], footprint.positions[1], footprint.positions[2]);
		const p1 = new Vec3(footprint.positions[3], footprint.positions[4], footprint.positions[5]);
		const p2 = new Vec3(footprint.positions[6], footprint.positions[7], footprint.positions[8]);
		const normal = MathUtils.calculateNormal(p0, p1, p2);

		for (let i = 0; i < footprint.normals.length; i += 3) {
			footprint.normals[i] = normal.x;
			footprint.normals[i + 1] = normal.y;
			footprint.normals[i + 2] = normal.z;
		}

		return {
			addSkirt: true,
			skirtHeight: skirtHeight,
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs
		};
	}
}