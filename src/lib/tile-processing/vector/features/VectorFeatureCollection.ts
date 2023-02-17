import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";

export default interface VectorFeatureCollection {
	nodes: VectorNode[];
	polylines: VectorPolyline[];
	areas: VectorArea[];
}