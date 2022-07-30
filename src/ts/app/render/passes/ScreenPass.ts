import Pass from "~/app/render/passes/Pass";
import * as RG from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import {InternalResourceType} from "~/render-graph";
import PassManager from "~/app/render/PassManager";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import ScreenMaterialContainer from "~/app/render/materials/ScreenMaterialContainer";

export default class ScreenPass extends Pass<{
	HDR: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	Output: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly material: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('ScreenPass', manager, {
			HDR: {type: InternalResourceType.Input, resource: manager.getSharedResource('HDRAntialiased')},
			Output: {type: InternalResourceType.Output, resource: manager.getSharedResource('BackbufferRenderPass')},
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.material = new ScreenMaterialContainer(this.renderer).material;
	}

	public render(): void {
		const sourceTexture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('Output'));

		this.material.getUniform('tHDR').value = sourceTexture;

		this.renderer.useMaterial(this.material);
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}