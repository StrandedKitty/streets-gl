import {VectorDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {Modifier} from "~/lib/tile-processing/vector/qualifiers/modifiers";

export enum QualifierType {
	Descriptor,
	Modifier
}

interface ModifierContainer {
	type: QualifierType.Modifier;
	data: Modifier;
}

interface DescriptorContainer<T extends VectorDescriptor> {
	type: QualifierType.Descriptor;
	data: T;
}

export type Qualifier<T extends VectorDescriptor> = ModifierContainer | DescriptorContainer<T>;