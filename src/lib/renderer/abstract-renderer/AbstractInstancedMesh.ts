import {AbstractMeshParams} from "~/lib/renderer/abstract-renderer/AbstractMesh";

export interface AbstractInstancedMeshParams extends AbstractMeshParams {
	indexed: boolean;
}

export default interface AbstractInstancedMesh {
	indexed: boolean;
}