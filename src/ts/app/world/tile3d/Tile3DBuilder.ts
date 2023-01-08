import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";
import Tile3D from "~/app/world/tile3d/Tile3D";
import HeightViewer from "~/app/world/HeightViewer";
import {GroundGeometryData} from "~/app/world/universal-features/providers/GroundGeometryBuilder";
import RoadGraph from "~/app/world/tile3d/RoadGraph";

export default class Tile3DBuilder {
	public fromUniversalFeatures(
		{
			collection,
			heightViewer,
			groundData
		}: {
			collection: UniversalFeatureCollection;
			heightViewer: HeightViewer;
			groundData: GroundGeometryData;
		}
	): Tile3D {
		const roadGraph = new RoadGraph(collection.polylines);
		const {polylines: roadGraphPolylines, areas: roadGraphAreas} = roadGraph.processIntersections();

		const universalNodes = [...collection.nodes];
		const universalPolylines = roadGraphPolylines;
		const universalAreas = collection.areas.concat(roadGraphAreas);

		return {
			bbox: {max: [], min: []},
			bboxGround: {max: [], min: []},
			building: undefined,
			ground: undefined,
			instancesLOD0: undefined,
			instancesLOD1: undefined,
			labels: {position: [], priority: [], text: []},
			roads: undefined
		};
	}
}