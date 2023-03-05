import Vec2 from "~/lib/math/Vec2";
import MansardRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/MansardRoofBuilder";

export default class QuadrupleSaltboxRoofBuilder extends MansardRoofBuilder {
	protected override splitProgress: number = 0.5;
	protected override edgeBumpFactor: number = 0;

	protected override triangulateTopAndBottom(
		{
			verticesBottom,
			verticesTop,
			minHeight,
			height,
			maxSkeletonHeight,
			edge,
			scaleX,
			scaleY
		} : {
			verticesBottom: number[];
			verticesTop: number[];
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			edge: [Vec2, Vec2];
			scaleX: number;
			scaleY: number;
		}
	): {position: number[]; uv: number[]} {
		const bottom = this.triangulatePolygon(
			verticesBottom, minHeight, height * 2, maxSkeletonHeight, edge, scaleX, scaleY
		);
		const top = this.triangulatePolygon(
			verticesTop, minHeight + height, 0, maxSkeletonHeight, edge, scaleX, scaleY
		);

		return {
			position: bottom.position.concat(top.position),
			uv: bottom.uv.concat(top.uv)
		};
	}
}