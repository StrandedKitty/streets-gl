import AbstractAttribute from "~/renderer/abstract-renderer/AbstractAttribute";

export interface AbstractMeshParams {
	indexed?: boolean;
	indices?: Uint32Array;
	attributes?: AbstractAttribute[];
}

export default interface AbstractMesh {
	indexed: boolean;
	indices: Uint32Array;
	getAttribute(name: string): AbstractAttribute;
	addAttribute(attribute: AbstractAttribute): void;
	draw(): void;
	delete(): void;
}