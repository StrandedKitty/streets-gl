import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import Config from "~/app/Config";

export default class FenceBuilder {
	public static build(
		{
			vertices,
			minHeight,
			height,
			uvWidth,
			uvHeight,
			uvHorizontalOffset = 0
		}: {
			vertices: Vec2[];
			minHeight: number;
			height: number;
			uvWidth: number;
			uvHeight: number;
			uvHorizontalOffset?: number;
		}
	): {
		position: number[];
		uv: number[];
		normal: number[];
	} {
		const position: number[] = [];
		const uv: number[] = [];
		const normal: number[] = [];
		let uvProgress: number = uvHorizontalOffset;

		const maxHeight = minHeight + height;

		for (let i = 0; i < vertices.length - 1; i++) {
			const vertex = vertices[i];
			const nextVertex = vertices[i + 1];
			const segmentLength = Vec2.distance(vertex, nextVertex);

			position.push(
				vertex.x, minHeight, vertex.y,
				nextVertex.x, minHeight, nextVertex.y,
				vertex.x, maxHeight, vertex.y,

				nextVertex.x, minHeight, nextVertex.y,
				nextVertex.x, maxHeight, nextVertex.y,
				vertex.x, maxHeight, vertex.y
			);

			uv.push(
				uvProgress / uvWidth, 0,
				(uvProgress + segmentLength) / uvWidth, 0,
				uvProgress / uvWidth, uvHeight,

				(uvProgress + segmentLength) / uvWidth, 0,
				(uvProgress + segmentLength) / uvWidth, uvHeight,
				uvProgress / uvWidth, uvHeight,
			);

			const segmentNormal = MathUtils.calculateNormal(
				new Vec3(nextVertex.x, 0, nextVertex.y),
				new Vec3(vertex.x, 1, vertex.y),
				new Vec3(vertex.x, 0, vertex.y)
			);

			for (let j = 0; j < 6; j++) {
				normal.push(segmentNormal.x, segmentNormal.y, segmentNormal.z);
			}

			uvProgress += segmentLength;
		}

		return {
			position,
			uv,
			normal
		};
	}
}