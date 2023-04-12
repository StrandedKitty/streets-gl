import AbstractTexture2D, {AbstractTexture2DParams} from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import AbstractTexture2DArray, {AbstractTexture2DArrayParams} from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import AbstractTextureCube, {AbstractTextureCubeParams} from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import AbstractRenderPass, {AbstractRenderPassParams} from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import AbstractMaterial, {AbstractMaterialParams} from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import AbstractAttribute, {AbstractAttributeParams} from "~/lib/renderer/abstract-renderer/AbstractAttribute";
import AbstractMesh, {AbstractMeshParams} from "./AbstractMesh";
import AbstractTexture3D, {AbstractTexture3DParams} from "~/lib/renderer/abstract-renderer/AbstractTexture3D";
import AbstractAttributeBuffer, {
	AbstractAttributeBufferParams
} from "~/lib/renderer/abstract-renderer/AbstractAttributeBuffer";

export default interface AbstractRenderer {
	setSize(width: number, height: number): void;
	createTexture2D(params: AbstractTexture2DParams): AbstractTexture2D;
	createTexture2DArray(params: AbstractTexture2DArrayParams): AbstractTexture2DArray;
	createTexture3D(params: AbstractTexture3DParams): AbstractTexture3D;
	createTextureCube(params: AbstractTextureCubeParams): AbstractTextureCube;
	createRenderPass(params: AbstractRenderPassParams): AbstractRenderPass;
	createMaterial(params: AbstractMaterialParams): AbstractMaterial;
	createAttribute(params: AbstractAttributeParams): AbstractAttribute;
	createAttributeBuffer(params?: AbstractAttributeBufferParams): AbstractAttributeBuffer;
	createMesh(params: AbstractMeshParams): AbstractMesh;
	beginRenderPass(renderPass: AbstractRenderPass): void;
	useMaterial(material: AbstractMaterial): void;
	startTimer(): void;
	finishTimer(): Promise<number>;
	fence(): Promise<void>;
	readonly rendererInfo: [string, string];
	readonly resolution: { x: number; y: number };
}