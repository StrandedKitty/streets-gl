import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import {InternalResourceType} from "~/lib/render-graph";
import PassManager from "../PassManager";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import ScreenMaterialContainer from "../materials/ScreenMaterialContainer";
import {UniformFloat1, UniformFloat2} from "~/lib/renderer/abstract-renderer/Uniform";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ControlsSystem from "~/app/systems/ControlsSystem";

export default class ScreenPass extends Pass<{
	HDR: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	Labels: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SlippyMap: {
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
			SlippyMap: {type: InternalResourceType.Input, resource: manager.getSharedResource('SlippyMap')},
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

	private getHDRTexture(): AbstractTexture2D | null {
		let texture = null;

		if (this.getResource('HDR')) {
			texture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;
		}

		return texture;
	}

	private getSlippyMapTexture(): AbstractTexture2D | null {
		let texture = null;

		if (this.getResource('SlippyMap')) {
			texture = <AbstractTexture2D>this.getPhysicalResource('SlippyMap').colorAttachments[0].texture;
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
		}
	}

	public render(): void {
		this.updateMaterialDefines();

		const slippyMapFactor = this.manager.systemManager.getSystem(ControlsSystem).slippyMapAndTilesFactor;
		const uiResolution = this.manager.renderSystem.resolutionUI;

		this.renderer.beginRenderPass(this.getPhysicalResource('Output'));

		this.material.getUniform('tHDR').value = this.getHDRTexture();
		this.material.getUniform('tLabels').value = this.getLabelsTexture();
		this.material.getUniform('tSlippyMap').value = this.getSlippyMapTexture();
		this.material.getUniform<UniformFloat2>('resolution', 'Uniforms').value[0] = uiResolution.x;
		this.material.getUniform<UniformFloat2>('resolution', 'Uniforms').value[1] = uiResolution.y;
		this.material.getUniform<UniformFloat1>('slippyMapFactor', 'Uniforms').value[0] = slippyMapFactor;
		this.material.updateUniformBlock('Uniforms');

		this.renderer.useMaterial(this.material);
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}