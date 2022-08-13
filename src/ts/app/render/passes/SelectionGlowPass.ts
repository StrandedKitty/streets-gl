import Pass from "~/app/render/passes/Pass";
import * as RG from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import {InternalResourceType} from "~/render-graph";
import PassManager from "~/app/render/PassManager";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import ScreenMaterialContainer from "~/app/render/materials/ScreenMaterialContainer";

export default class SelectionGlowPass extends Pass<{
}> {
	private readonly material: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('ScreenPass', manager, {});
	}

	public render(): void {
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}