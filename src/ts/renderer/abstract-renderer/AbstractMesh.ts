import AbstractMaterial from "./AbstractMaterial";
import AbstractAttribute from "~/renderer/abstract-renderer/AbstractAttribute";

export interface AbstractMeshParams {
	indexed?: boolean;
	attributes?: AbstractAttribute[]
}

export default interface AbstractMesh {
	indexed: boolean;
	getAttribute(name: string): AbstractAttribute;
	addAttribute(attribute: AbstractAttribute): void;
	draw(): void;
	delete(): void;
}