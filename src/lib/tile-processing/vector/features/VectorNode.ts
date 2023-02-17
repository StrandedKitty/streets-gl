import VectorFeature from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/descriptors";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";

export default interface VectorNode extends VectorFeature {
	type: 'node';
	osmReference: OSMReference;
	descriptor: VectorNodeDescriptor;
	x: number;
	y: number;
}