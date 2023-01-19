import Tile3DFeature from "./Tile3DFeature";
import UniversalPolyline from "../universal-features/UniversalPolyline";
import HeightViewer from "../HeightViewer";
import RoadPolylineBuilder from "../geometry/RoadPolylineBuilder";
import Vec2 from "~/lib/math/Vec2";
import MeshGroundProjector from "../geometry/features/MeshGroundProjector";

export default class Tile3DPolyline extends Tile3DFeature<UniversalPolyline> {
	public constructor(universalPolyline: UniversalPolyline, heightViewer: HeightViewer) {
		super(universalPolyline, heightViewer);
	}

	public buildGeometry(projector: MeshGroundProjector): void {
		const points = this.universal.nodes.map(n => new Vec2(n.x, n.y));
		const triangles = RoadPolylineBuilder.build(points, 10);
	}
}