import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import {InternalResourceType} from "~/lib/render-graph";
import PassManager from "../PassManager";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import ScreenMaterialContainer from "../materials/ScreenMaterialContainer";
import {UniformFloat2} from "~/lib/renderer/abstract-renderer/Uniform";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";

export default class ScreenPass extends Pass<{
	HDR: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	Labels: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainHeight: {
		type: RG.InternalResourceType.Input;
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
			HDR: {type: InternalResourceType.Input, resource: manager.getSharedResource('Bloom')},
			Labels: {type: InternalResourceType.Input, resource: manager.getSharedResource('Labels')},
			TerrainHeight: {type: InternalResourceType.Input, resource: manager.getSharedResource('TerrainHeight')},
			Output: {type: InternalResourceType.Output, resource: manager.getSharedResource('BackbufferRenderPass')}
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.material = new ScreenMaterialContainer(this.renderer).material;
	}

	private getLabelsTexture(): AbstractTexture2D | null {
		let texture = null;

		if (this.getResource('Labels')) {
			texture = <AbstractTexture2D>this.getPhysicalResource('Labels').colorAttachments[0].texture;
		}

		return texture;
	}

	private updateMaterialDefines(): void {
		let needsRecompilation = false;

		const newValues = {
			LABELS_ENABLED: this.getResource('Labels') ? '1' : '0'
		};

		for (const [k, v] of Object.entries(newValues)) {
			if (this.material.defines[k] !== v) {
				this.material.defines[k] = v;
				needsRecompilation = true;
			}
		}

		if (needsRecompilation) {
			this.material.recompile();
			console.log('recompile screen')
		}
	}

	public render(): void {
		this.updateMaterialDefines();

		const sourceTexture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;
		const labelsTexture = this.getLabelsTexture();
		const uiResolution = this.manager.renderSystem.resolutionUI;

		this.renderer.beginRenderPass(this.getPhysicalResource('Output'));

		this.material.getUniform('tHDR').value = sourceTexture;
		this.material.getUniform('tLabels').value = labelsTexture;
		this.material.getUniform('tDebug').value = <AbstractTexture2D>this.getPhysicalResource('TerrainHeight').colorAttachments[0].texture;
		this.material.getUniform<UniformFloat2>('resolution', 'Uniforms').value[0] = uiResolution.x;
		this.material.getUniform<UniformFloat2>('resolution', 'Uniforms').value[1] = uiResolution.y;
		this.material.updateUniformBlock('Uniforms');

		this.renderer.useMaterial(this.material);
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}