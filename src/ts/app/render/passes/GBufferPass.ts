import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {RendererTypes} from "~/renderer/RendererTypes";
import {UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import Tile from "~/app/objects/Tile";
import Mat4 from "../../../math/Mat4";
import AbstractRenderPass from "../../../renderer/abstract-renderer/AbstractRenderPass";
import Shaders from "../shaders/Shaders";
import AbstractTexture2D from "../../../renderer/abstract-renderer/AbstractTexture2D";
import Pass from "~/app/render/passes/Pass";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import {InternalResourceType} from '~/render-graph/Pass';
import PassManager from '~/app/render/PassManager';

export default class GBufferPass extends Pass<{
	BackbufferRenderPass: {
		type: InternalResourceType.Output,
		resource: RenderPassResource
	},
	GBufferRenderPass: {
		type: InternalResourceType.Output,
		resource: RenderPassResource
	}
}> {
	private material: AbstractMaterial;
	private material2: AbstractMaterial;
	private materialSkybox: AbstractMaterial;
	private fullScreenTriangle: FullScreenTriangle;

	constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			BackbufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('BackbufferRenderPass')},
			GBufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('GBufferRenderPass')}
		});

		this.init();
	}

	private init() {
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

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
					name: 'projectionMatrix',
					block: 'PerMaterial',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array(16)
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

		this.material2 = this.renderer.createMaterial({
			name: 'Compose material',
			uniforms: [
				{
					name: 'map',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.ldrCompose.vertex,
			fragmentShaderSource: Shaders.ldrCompose.fragment
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

		for (const tile of tiles) {
			if (!tile.buildingsMesh && tile.readyForRendering) {
				tile.createMeshes(this.renderer);
			}
		}

		const testRenderPass = <AbstractRenderPass>this.getPhysicalResource('GBufferRenderPass');
		const backbufferRenderPass = <AbstractRenderPass>this.getPhysicalResource('BackbufferRenderPass');

		this.renderer.beginRenderPass(testRenderPass);

		this.renderer.useMaterial(this.materialSkybox);

		this.materialSkybox.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.projectionMatrix.values);
		this.materialSkybox.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.materialSkybox.applyUniformUpdates('projectionMatrix', 'Uniforms');
		this.materialSkybox.applyUniformUpdates('modelViewMatrix', 'Uniforms');

		skybox.draw();

		this.renderer.useMaterial(this.material);

		this.material.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
		this.material.applyUniformUpdates('projectionMatrix', 'PerMaterial');

		for (const tile of tiles) {
			if (!tile.buildingsMesh) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);

			this.material.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.material.applyUniformUpdates('modelViewMatrix', 'PerMesh');

			tile.buildingsMesh.draw();
		}

		this.material2.getUniform('map').value = <AbstractTexture2D>testRenderPass.colorAttachments[0].texture;

		this.renderer.beginRenderPass(backbufferRenderPass);
		this.renderer.useMaterial(this.material2);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number) {
		this.getResource('GBufferRenderPass').descriptor.setSize(width, height);
	}
}