import Tile3DFeature from "~/app/world/tile3d/Tile3DFeature";
import UniversalPolyline from "~/app/world/universal-features/UniversalPolyline";
import HeightViewer from "~/app/world/HeightViewer";
import RoadPolylineBuilder from "~/app/world/geometry/RoadPolylineBuilder";
import Vec2 from "~/math/Vec2";
import MeshGroundProjector from "~/app/world/geometry/features/MeshGroundProjector";

export default class Tile3DPolyline extends Tile3DFeature<UniversalPolyline> {
	public constructor(universalPolyline: UniversalPolyline, heightViewer: HeightViewer) {
		super(universalPolyline, heightViewer);
	}

	public buildGeometry(projector: MeshGroundProjector): void {
		const points = this.universal.nodes.map(n => new Vec2(n.x, n.y));
		const triangles = RoadPolylineBuilder.build(points, 10);
	}
}