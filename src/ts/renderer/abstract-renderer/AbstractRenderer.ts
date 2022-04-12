import AbstractTexture2D, {AbstractTexture2DParams} from "~/renderer/abstract-renderer/AbstractTexture2D";
import AbstractTexture2DArray, {AbstractTexture2DArrayParams} from "~/renderer/abstract-renderer/AbstractTexture2DArray";
import AbstractTextureCube, {AbstractTextureCubeParams} from "~/renderer/abstract-renderer/AbstractTextureCube";
import AbstractRenderPass, {AbstractRenderPassParams} from "~/renderer/abstract-renderer/AbstractRenderPass";
import AbstractMaterial, {AbstractMaterialParams} from "~/renderer/abstract-renderer/AbstractMaterial";
import AbstractAttribute, {AbstractAttributeParams} from "~/renderer/abstract-renderer/AbstractAttribute";
import AbstractMesh, {AbstractMeshParams} from "./AbstractMesh";
import AbstractTexture3D, {AbstractTexture3DParams} from "~/renderer/abstract-renderer/AbstractTexture3D";

export default interface AbstractRenderer {
	setSize(width: number, height: number): void;
	createTexture2D(params: AbstractTexture2DParams): AbstractTexture2D;
	createTexture2DArray(params: AbstractTexture2DArrayParams): AbstractTexture2DArray;
	createTexture3D(params: AbstractTexture3DParams): AbstractTexture3D;
	createTextureCube(params: AbstractTextureCubeParams): AbstractTextureCube;
	createRenderPass(params: AbstractRenderPassParams): AbstractRenderPass;
	createMaterial(params: AbstractMaterialParams): AbstractMaterial;
	createAttribute(params: AbstractAttributeParams): AbstractAttribute;
	createMesh(params: AbstractMeshParams): AbstractMesh;
	beginRenderPass(renderPass: AbstractRenderPass): void;
	useMaterial(material: AbstractMaterial): void;
	fence(): Promise<void>;
	readonly rendererInfo: [string, string];
	readonly resolution: { x: number, y: number };
}