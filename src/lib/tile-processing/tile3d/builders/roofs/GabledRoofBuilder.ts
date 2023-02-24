import {Skeleton} from "straight-skeleton";
import HippedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/HippedRoofBuilder";
import {RoofSkirt} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";
import Tile3DRing from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import {signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";

export default class GabledRoofBuilder extends HippedRoofBuilder {
	protected override convertSkeletonToVertices(
		{
			multipolygon,
			skeleton,
			minHeight,
			height,
			maxSkeletonHeight,
			flip
		}: {
			multipolygon: Tile3DMultipolygon;
			skeleton: Skeleton;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			flip: boolean;
		}
	): {position: number[]; uv: number[]; skirt?: RoofSkirt} {
		let positionResult: number[] = [];
		let uvResult: number[] = [];
		const skirt: RoofSkirt = new Map();
		const nodeMap: Map<string, [Tile3DRing, Vec2]> = new Map();

		for (const ring of multipolygon.rings) {
			skirt.set(ring, ring.nodes.map(node => [node, minHeight]));
			for (const node of ring.nodes) {
				nodeMap.set(`${node.x},${node.y}`, [ring, node]);
			}
		}

		for (const edge of skeleton.Edges) {
			if (edge.Polygon.length === 3) {
				const edgeLine: [Vec2, Vec2] = [
					new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
					new Vec2(edge.Edge.End.X, edge.Edge.End.Y)
				];

				const a = edge.Edge.Begin;
				const b = edge.Edge.End;
				const c = edge.Polygon.find(p => p.NotEquals(a) && p.NotEquals(b));
				const cHeight = signedDstToLine(new Vec2(c.X, c.Y), edgeLine);

				const diff = b.Sub(a);
				const center = a.Add(diff.MultiplyScalar(0.5));

				const points = [
					a.X, 0, a.Y,
					c.X, cHeight, c.Y,
					center.X, cHeight, center.Y,

					b.X, 0, b.Y,
					center.X, cHeight, center.Y,
					c.X, cHeight, c.Y
				];
				const uvs = [
					0, 0,
					0, 0,
					0, 0,
					0, 0,
					0, 0,
					0, 0,
				];

				for (let i = 0; i < points.length; i += 3) {
					const y = points[i + 1];

					points[i + 1] = minHeight + y / maxSkeletonHeight * height;
				}

				if (flip) {
					points.reverse();
				}

				positionResult = positionResult.concat(points);
				uvResult = uvResult.concat(uvs);
			} else {
				const {position, uv} = this.convertEdgeResultToVertices({
					edge,
					minHeight,
					height,
					maxSkeletonHeight
				});

				if (flip) {
					position.reverse();
				}

				positionResult = positionResult.concat(position);
				uvResult = uvResult.concat(uv);
			}
		}

		return {position: positionResult, uv: uvResult, skirt};
	}
}