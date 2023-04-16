import RoofBuilder, {RoofGeometry, RoofParams, RoofSkirt, RoofSkirtPolyline} from "./RoofBuilder";
import MathUtils from "~/lib/math/MathUtils";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import AABB2D from "~/lib/math/AABB2D";

export default class SkillionRoofBuilder implements RoofBuilder {
	private getRoofHeightFromAngle(bbox: AABB2D, angle: number): number {
		return (bbox.max.y - bbox.min.y) * Math.tan(MathUtils.toRad(angle));
	}

	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, direction} = params;
		const skirt: RoofSkirt = [];
		const rotation = -MathUtils.toRad(direction ?? 0) - Math.PI / 2;
		const bbox = new AABB2D();

		for (const ring of multipolygon.rings) {
			for (const node of ring.nodes) {
				bbox.includePoint(Vec2.rotate(node, rotation));
			}
		}

		let facadeHeightOverride: number = null;
		let height = params.height;
		let minHeight = params.minHeight;

		if (params.angle !== null && params.angle !== undefined) {
			height = this.getRoofHeightFromAngle(bbox, params.angle)
			minHeight = params.buildingHeight - height;
			facadeHeightOverride = params.buildingHeight - height;
		}

		const footprint = multipolygon.getFootprint({
			height: 0,
			flip: false
		});

		for (let i = 0; i < footprint.positions.length; i += 3) {
			const x = footprint.positions[i];
			const z = footprint.positions[i + 2];
			const vec = Vec2.rotate(new Vec2(x, z), rotation);
			const y = (vec.y - bbox.min.y) / (bbox.max.y - bbox.min.y);

			footprint.positions[i + 1] = minHeight + y * height;
		}

		const bboxHeight = bbox.max.y - bbox.min.y;
		const uvScaleX = 1 / params.scaleX;
		const uvScaleY = 1 / Math.sin(Math.atan(bboxHeight / height)) / params.scaleY;

		for (let i = 0; i < footprint.uvs.length; i += 2) {
			const x = footprint.uvs[i];
			const y = footprint.uvs[i + 1];
			const vec = Vec2.rotate(new Vec2(x, y), rotation);

			footprint.uvs[i] = (vec.x - bbox.min.x) * uvScaleX;
			footprint.uvs[i + 1] = (vec.y - bbox.min.y) * uvScaleY;
		}

		for (const ring of multipolygon.rings) {
			const skirtPolyline: RoofSkirtPolyline = {
				points: [],
				hasWindows: true
			};
			skirt.push(skirtPolyline);

			for (const node of ring.nodes) {
				const vec = Vec2.rotate(node, rotation);
				const y = (vec.y - bbox.min.y) / (bbox.max.y - bbox.min.y);

				skirtPolyline.points.push({
					position: node,
					height: minHeight + y * height
				});
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
			skirt: skirt,
			facadeHeightOverride: facadeHeightOverride,
			position: footprint.positions,
			normal: footprint.normals,
			uv: footprint.uvs
		};
	}
}