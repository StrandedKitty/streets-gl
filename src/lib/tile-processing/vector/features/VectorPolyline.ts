import VectorFeature from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/descriptors";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";

export default interface VectorPolyline extends VectorFeature {
	type: 'polyline';
	osmReference: OSMReference;
	descriptor: VectorPolylineDescriptor;
	nodes: VectorNode[];
}