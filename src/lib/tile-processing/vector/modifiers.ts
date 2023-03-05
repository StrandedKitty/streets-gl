import {
	VectorAreaDescriptor,
	VectorNodeDescriptor,
	VectorPolylineDescriptor
} from "~/lib/tile-processing/vector/descriptors";

export enum ModifierType {
	NodeRow,
	CircleArea
}

interface BaseModifier {
	type: ModifierType;
	descriptor: VectorNodeDescriptor | VectorAreaDescriptor | VectorPolylineDescriptor;
}

export interface NodeRowModifier extends BaseModifier {
	type: ModifierType.NodeRow;
	spacing: number;
	randomness: number;
	descriptor: VectorNodeDescriptor;
}

export interface CircleAreaModifier extends BaseModifier {
	type: ModifierType.CircleArea;
	radius: number;
	descriptor: VectorAreaDescriptor;
}

export type Modifier = NodeRowModifier | CircleAreaModifier;