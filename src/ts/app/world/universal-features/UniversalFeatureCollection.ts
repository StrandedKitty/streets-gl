import UniversalNode from "~/app/world/universal-features/UniversalNode";
import UniversalPolyline from "~/app/world/universal-features/UniversalPolyline";
import UniversalArea from "~/app/world/universal-features/UniversalArea";

export default interface UniversalFeatureCollection {
	nodes: UniversalNode[];
	polylines: UniversalPolyline[];
	areas: UniversalArea[];
}