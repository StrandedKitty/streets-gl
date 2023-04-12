import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import VectorFeatureBase from "~/lib/tile-processing/vector/features/VectorFeatureBase";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default interface VectorPolyline extends VectorFeatureBase {
	type: 'polyline';
	osmReference: OSMReference;
	descriptor: VectorPolylineDescriptor;
	nodes: VectorNode[];
}