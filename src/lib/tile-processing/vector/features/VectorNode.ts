import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import VectorFeatureBase from "~/lib/tile-processing/vector/features/VectorFeatureBase";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default interface VectorNode extends VectorFeatureBase {
	type: 'node';
	osmReference: OSMReference;
	descriptor: VectorNodeDescriptor;
	x: number;
	y: number;
	rotation: number;
}