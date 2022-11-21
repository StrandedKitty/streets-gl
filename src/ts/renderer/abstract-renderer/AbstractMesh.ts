import AbstractAttribute from "~/renderer/abstract-renderer/AbstractAttribute";

export interface AbstractMeshParams {
	indexed?: boolean;
	indices?: Uint32Array;
	instanced?: boolean;
	instanceCount?: number;
	attributes?: AbstractAttribute[];
}

export default interface AbstractMesh {
	indexed: boolean;
	indices: Uint32Array;
	instanced: boolean;
	instanceCount: number;
	getAttribute(name: string): AbstractAttribute;
	addAttribute(attribute: AbstractAttribute): void;
	setIndices(indices: Uint32Array): void;
	draw(): void;
	delete(): void;
}