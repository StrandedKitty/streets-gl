import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {RendererTypes} from "~/renderer/RendererTypes";
import {UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import Tile from "~/app/objects/Tile";
import Mat4 from "../../../math/Mat4";
import AbstractRenderPass from "../../../renderer/abstract-renderer/AbstractRenderPass";
import Shaders from "../shaders/Shaders";
import Pass from "~/app/render/passes/Pass";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import {InternalResourceType} from '~/render-graph/Pass';
import PassManager from '~/app/render/PassManager';
import ResourceManager from '~/app/world/ResourceManager';

export default class GBufferPass extends Pass<{
	GBufferRenderPass: {
		type: InternalResourceType.Output,
		resource: RenderPassResource
	}
}> {
	private material: AbstractMaterial;
	private materialSkybox: AbstractMaterial;
	private cameraMatrixWorldInversePrev: Mat4 = null;

	constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			GBufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('GBufferRenderPass')}
		});

		this.init();
	}

	private init() {
		this.createMaterials();
	}

	private createMaterials() {
		this.material = this.renderer.createMaterial({
			name: 'GBuffer material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'PerMesh',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'tRoofColor',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 4,
						anisotropy: 16,
						data: [
							ResourceManager.get('roofColor1'),
							ResourceManager.get('roofColor2'),
							ResourceManager.get('roofColor3'),
							ResourceManager.get('roofColor4'),
						],
						wrap: RendererTypes.TextureWrap.ClampToEdge,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}, {
					name: 'tRoofNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2DArray,
					value: this.renderer.createTexture2DArray({
						width: 512,
						height: 512,
						depth: 4,
						anisotropy: 16,
						data: [
							ResourceManager.get('roofNormal1'),
							ResourceManager.get('roofNormal2'),
							ResourceManager.get('roofNormal3'),
							ResourceManager.get('roofNormal4'),
						],
						wrap: RendererTypes.TextureWrap.ClampToEdge,
						format: RendererTypes.TextureFormat.RGBA8Unorm,
						mipmaps: true
					})
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Back
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.building.vertex,
			fragmentShaderSource: Shaders.building.fragment
		});

		this.materialSkybox = this.renderer.createMaterial({
			name: 'Skybox material',
			uniforms: [
				{
					name: 'modelViewMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'modelViewMatrixPrev',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}, {
					name: 'projectionMatrix',
					block: 'Uniforms',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.Front
			},
			depth: {
				depthWrite: false,
				depthCompare: RendererTypes.DepthCompare.Always
			},
			vertexShaderSource: Shaders.skybox.vertex,
			fragmentShaderSource: Shaders.skybox.fragment
		});
	}

	public render() {
		const camera = this.manager.sceneSystem.objects.camera;
		const skybox = this.manager.sceneSystem.objects.skybox;
		const tiles = this.manager.sceneSystem.objects.tiles.children as Tile[];

		if (!this.cameraMatrixWorldInversePrev) {
			this.cameraMatrixWorldInversePrev = camera.matrixWorldInverse;
		} else {
			const pivotDelta = this.manager.sceneSystem.pivotDelta;

			this.cameraMatrixWorldInversePrev = Mat4.translate(
				this.cameraMatrixWorldInversePrev,
				pivotDelta.x,
				0,
				pivotDelta.y
			);
		}

		for (const tile of tiles) {
			if (!tile.buildingsMesh && tile.readyForRendering) {
				tile.createMeshes(this.renderer);
			}
		}

		const testRenderPass = this.getPhysicalResource('GBufferRenderPass');

		this.renderer.beginRenderPass(testRenderPass);

		this.renderer.useMaterial(this.materialSkybox);

		this.materialSkybox.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.projectionMatrix.values);
		this.materialSkybox.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.materialSkybox.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'Uniforms').value = new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, skybox.matrixWorld).values);
		this.materialSkybox.applyUniformUpdates('projectionMatrix', 'Uniforms');
		this.materialSkybox.applyUniformUpdates('modelViewMatrix', 'Uniforms');
		this.materialSkybox.applyUniformUpdates('modelViewMatrixPrev', 'Uniforms');

		skybox.draw();

		this.renderer.useMaterial(this.material);

		this.material.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
		this.material.applyUniformUpdates('projectionMatrix', 'PerMaterial');

		for (const tile of tiles) {
			if (!tile.buildingsMesh) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.material.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.material.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.material.applyUniformUpdates('modelViewMatrix', 'PerMesh');
			this.material.applyUniformUpdates('modelViewMatrixPrev', 'PerMesh');

			tile.buildingsMesh.draw();
		}

		const buffer = new Uint8Array(4);

		/*testRenderPass.readColorAttachmentPixel(0, buffer, 0, 0, 1, 1).then(() => {
			//console.log(buffer);
		});*/

		this.saveCameraMatrixWorldInverse();
	}

	private saveCameraMatrixWorldInverse() {
		this.cameraMatrixWorldInversePrev = this.manager.sceneSystem.objects.camera.matrixWorldInverse;
	}

	public setSize(width: number, height: number) {
		this.getResource('GBufferRenderPass').descriptor.setSize(width, height);
	}
}