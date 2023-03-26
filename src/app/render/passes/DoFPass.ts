import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import {InternalResourceType} from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import PassManager from "../PassManager";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import CoCMaterialContainer from "../materials/CoCMaterialContainer";
import CoCDownscaleMaterialContainer from "../materials/CoCDownscaleMaterialContainer";
import DoFMaterialContainer from "../materials/DoFMaterialContainer";
import DoFBlurMaterialContainer from "../materials/DoFBlurMaterialContainer";
import CoCAntialiasMaterialContainer from "../materials/CoCAntialiasMaterialContainer";
import DoFCombineMaterialContainer from "../materials/DoFCombineMaterialContainer";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";

const getFocalLength = (sensorSize: number, cameraFoV: number): number => {
	return sensorSize / (Math.tan(MathUtils.toRad(cameraFoV) / 2) * 2);
};

export default class DoFPass extends Pass<{
	HDR: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	GBuffer: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	CoC: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	CoCHistory: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	CoCAntialiased: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	CoCWithColorDownscaled: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	DoFRaw: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	DoFBlurred: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	DoF: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly cocMaterial: AbstractMaterial;
	private readonly cocAntialiasMaterial: AbstractMaterial;
	private readonly cocDownscaleMaterial: AbstractMaterial;
	private readonly dofMaterial: AbstractMaterial;
	private readonly dofBlurMaterial: AbstractMaterial;
	private readonly dofCombineMaterial: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('DoFPass', manager, {
			HDR: {type: InternalResourceType.Input, resource: manager.getSharedResource('HDRAntialiased')},
			GBuffer: {type: InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			CoC: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoC')},
			CoCHistory: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoCHistory')},
			CoCAntialiased: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoCAntialiased')},
			CoCWithColorDownscaled: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoCWithColorDownscaled')},
			DoFRaw: {type: InternalResourceType.Local, resource: manager.getSharedResource('DoFRaw')},
			DoFBlurred: {type: InternalResourceType.Local, resource: manager.getSharedResource('DoFBlurred')},
			DoF: {type: InternalResourceType.Output, resource: manager.getSharedResource('DoF')},
		});

		this.cocMaterial = new CoCMaterialContainer(this.renderer).material;
		this.cocAntialiasMaterial = new CoCAntialiasMaterialContainer(this.renderer).material;
		this.cocDownscaleMaterial = new CoCDownscaleMaterialContainer(this.renderer).material;
		this.dofMaterial = new DoFMaterialContainer(this.renderer).material;
		this.dofBlurMaterial = new DoFBlurMaterialContainer(this.renderer).material;
		this.dofCombineMaterial = new DoFCombineMaterialContainer(this.renderer).material;

		this.fullScreenTriangle = this.manager.renderSystem.fullScreenTriangle;

		this.listenToSettings();
	}

	private listenToSettings(): void {
		this.manager.settings.onChange('dof', ({statusValue}) => {
			const quality = statusValue === 'low' ? '0' : '1';

			if (this.dofMaterial.defines.QUALITY !== quality) {
				this.dofMaterial.defines.QUALITY = quality;
				this.dofMaterial.recompile();
			}
		}, true);
	}

	private updateCoCDefines(camera: PerspectiveCamera): void {
		const defines = {
			F_NUMBER: this.manager.settings.get('dofAperture').numberValue.toFixed(16),
			FOCAL_LENGTH: getFocalLength(+this.cocMaterial.defines.SENSOR_HEIGHT, camera.fov).toFixed(16)
		};

		let needsRecompile = false;

		for (const [key, value] of Object.entries(defines)) {
			if (this.cocMaterial.defines[key] !== value) {
				needsRecompile = true;
			}

			this.cocMaterial.defines[key] = value;
		}

		if (needsRecompile) {
			this.cocMaterial.recompile();
		}
	}

	public render(): void {
		this.updateCoCDefines(this.manager.sceneSystem.objects.camera);

		this.renderCoC();
		this.antialiasCoC();
		this.downscaleCoC();
		this.renderDoF();
		this.blurDoF();
		this.combineDoFWithSource();
	}

	private renderCoC(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoC'));

		this.cocMaterial.getUniform('tDepth').value = depthTexture;
		this.cocMaterial.getUniform('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.cocMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.cocMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private antialiasCoC(): void {
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const cocTexture = <AbstractTexture2D>this.getPhysicalResource('CoC').colorAttachments[0].texture;
		const cocHistoryTexture = <AbstractTexture2D>this.getPhysicalResource('CoCHistory').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoCAntialiased'));

		this.cocAntialiasMaterial.getUniform('tCoC').value = cocTexture;
		this.cocAntialiasMaterial.getUniform('tCoCHistory').value = cocHistoryTexture;
		this.cocAntialiasMaterial.getUniform('tMotion').value = motionTexture;

		this.renderer.useMaterial(this.cocAntialiasMaterial);
		this.fullScreenTriangle.mesh.draw();

		this.getPhysicalResource('CoCAntialiased').copyColorAttachmentToTexture(0, cocHistoryTexture);
	}

	private downscaleCoC(): void {
		const hdrTexture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;
		const cocTexture = <AbstractTexture2D>this.getPhysicalResource('CoCAntialiased').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoCWithColorDownscaled'));

		this.cocDownscaleMaterial.getUniform('tCoC').value = cocTexture;
		this.cocDownscaleMaterial.getUniform('tColor').value = hdrTexture;

		this.renderer.useMaterial(this.cocDownscaleMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private renderDoF(): void {
		const cocDownscaledTexture = <AbstractTexture2D>this.getPhysicalResource('CoCWithColorDownscaled').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('DoFRaw'));

		this.dofMaterial.getUniform('tCoC').value = cocDownscaledTexture;

		this.renderer.useMaterial(this.dofMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private blurDoF(): void {
		const dofTexture = <AbstractTexture2D>this.getPhysicalResource('DoFRaw').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('DoFBlurred'));

		this.dofBlurMaterial.getUniform('tMap').value = dofTexture;

		this.renderer.useMaterial(this.dofBlurMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private combineDoFWithSource(): void {
		const dofTexture = <AbstractTexture2D>this.getPhysicalResource('DoFBlurred').colorAttachments[0].texture;
		const hdrTexture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;
		const cocTexture = <AbstractTexture2D>this.getPhysicalResource('CoCAntialiased').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('DoF'));

		this.dofCombineMaterial.getUniform('tDoF').value = dofTexture;
		this.dofCombineMaterial.getUniform('tCoC').value = cocTexture;
		this.dofCombineMaterial.getUniform('tSource').value = hdrTexture;

		this.renderer.useMaterial(this.dofCombineMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}