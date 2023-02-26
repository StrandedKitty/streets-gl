import VectorFeature from "~/lib/tile-processing/vector/features/VectorFeature";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";

export enum VectorAreaRingType {
	Inner,
	Outer
}

export interface VectorAreaRing {
	nodes: VectorNode[];
	type: VectorAreaRingType;
}

export default interface VectorArea extends VectorFeature {
	type: 'area';
	osmReference: OSMReference;
	descriptor: VectorAreaDescriptor;
	rings: VectorAreaRing[];
	isBuildingPartInRelation?: boolean;
}