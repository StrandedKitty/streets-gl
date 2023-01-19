import UniversalNode from "./UniversalNode";
import UniversalPolyline from "./UniversalPolyline";
import UniversalArea from "./UniversalArea";

export default interface UniversalFeatureCollection {
	nodes: UniversalNode[];
	polylines: UniversalPolyline[];
	areas: UniversalArea[];
}