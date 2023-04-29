import System from '../System';
import Object3D from '~/lib/core/Object3D';
import PerspectiveCamera from '~/lib/core/PerspectiveCamera';
import Skybox from '../objects/Skybox';
import RenderableObject3D from '../objects/RenderableObject3D';
import Vec2 from '~/lib/math/Vec2';
import TileSystem from './TileSystem';
import CSM from "../render/CSM";
import Config from "../Config";
import MapTimeSystem from "./MapTimeSystem";
import Vec3 from "~/lib/math/Vec3";
import Labels from "../objects/Labels";
import GenericInstancedObject from "../objects/GenericInstancedObject";
import ModelManager from "../objects/models/ModelManager";
import InstancedAircraft from "../objects/InstancedAircraft";
import Terrain from "../objects/Terrain";
import Tile from "~/app/objects/Tile";
import SettingsSystem from "~/app/systems/SettingsSystem";
import InstancedTree from "~/app/objects/InstancedTree";
import AdvancedInstancedObject from "~/app/objects/AdvancedInstancedObject";
import InstancedObject from "~/app/objects/InstancedObject";
import {Tile3DInstanceLODConfig, Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Camera from "~/lib/core/Camera";
import Utils from "~/app/Utils";

interface SceneObjects {
	wrapper: Object3D;
	camera: PerspectiveCamera;
	skybox: Skybox;
	tiles: Tile[];
	csm: CSM;
	labels: Labels;
	terrain: Terrain;
	instancedObjects: Map<string, InstancedObject>;
	instancedAircraft: InstancedAircraft[];
}

export default class SceneSystem extends System {
	public scene: Object3D;
	public objects: SceneObjects;
	public pivotDelta: Vec2 = new Vec2();

	public postInit(): void {
		this.initScene();
		this.listenToSettings();
		this.listenToScreenResize();
	}

	private initScene(): void {
		this.scene = new Object3D();

		const wrapper = new Object3D();
		const camera = new PerspectiveCamera({
			fov: this.getCameraFoVFromSettings(),
			near: 10,
			far: 100000,
			aspect: window.innerWidth / window.innerHeight
		});
		const skybox = new Skybox();
		const tiles = new Object3D();
		const csm = new CSM({
			camera,
			near: camera.near,
			far: 4000,
			resolution: 2048,
			cascades: 3,
			shadowBias: -0.003,
			shadowNormalBias: 0.002,
		});
		const labels = new Labels();
		const terrain = new Terrain();

		const instancedAircraft = [
			new InstancedAircraft(ModelManager.getGLTFModel('aircraftB777')),
			new InstancedAircraft(ModelManager.getGLTFModel('aircraftA321')),
			new InstancedAircraft(ModelManager.getGLTFModel('aircraftCessna208')),
			new InstancedAircraft(ModelManager.getGLTFModel('aircraftERJ135'))
		];

		this.objects = {
			wrapper,
			camera,
			skybox,
			tiles: [],
			csm,
			labels,
			terrain,
			instancedObjects: new Map(),
			instancedAircraft
		};

		this.objects.instancedObjects.set('tree', new InstancedTree(ModelManager.getGLTFModel('tree')));
		this.objects.instancedObjects.set('adColumn', new GenericInstancedObject(ModelManager.getGLTFModel('adColumn')));
		this.objects.instancedObjects.set('transmissionTower', new GenericInstancedObject(ModelManager.getGLTFModel('transmissionTower')));
		this.objects.instancedObjects.set('hydrant', new GenericInstancedObject(ModelManager.getGLTFModel('hydrant')));
		this.objects.instancedObjects.set('trackedCrane', new GenericInstancedObject(ModelManager.getGLTFModel('trackedCrane')));
		this.objects.instancedObjects.set('towerCrane', new GenericInstancedObject(ModelManager.getGLTFModel('towerCrane')));
		this.objects.instancedObjects.set('bench', new GenericInstancedObject(ModelManager.getGLTFModel('bench')));
		this.objects.instancedObjects.set('picnicTable', new GenericInstancedObject(ModelManager.getGLTFModel('picnicTable')));
		this.objects.instancedObjects.set('busStop', new GenericInstancedObject(ModelManager.getGLTFModel('busStop')));
		this.objects.instancedObjects.set('windTurbine', new GenericInstancedObject(ModelManager.getGLTFModel('windTurbine')));
		this.objects.instancedObjects.set('memorial', new GenericInstancedObject(ModelManager.getGLTFModel('memorial')));
		this.objects.instancedObjects.set('statueSmall', new GenericInstancedObject(ModelManager.getGLTFModel('statue0')));
		this.objects.instancedObjects.set('statueBig', new GenericInstancedObject(ModelManager.getGLTFModel('statue1')));
		this.objects.instancedObjects.set('sculpture', new GenericInstancedObject(ModelManager.getGLTFModel('sculpture')));
		this.objects.instancedObjects.set('shrubbery', new GenericInstancedObject(ModelManager.getGLTFModel('shrubbery')));
		this.objects.instancedObjects.set('utilityPole', new GenericInstancedObject(ModelManager.getGLTFModel('utilityPole')));
		this.objects.instancedObjects.set('wire', new AdvancedInstancedObject(ModelManager.getGLTFModel('wire')));

		this.scene.add(wrapper);
		wrapper.add(
			camera, csm, skybox, tiles, labels, terrain,
			...this.objects.instancedObjects.values(),
			...instancedAircraft
		);
	}

	private getCameraFoVFromSettings(): number {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		return settings.get('fov').numberValue;
	}

	private listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		settings.onChange('fov', ({numberValue}) => {
			this.objects.camera.fov = numberValue;
			this.objects.camera.updateProjectionMatrix();
		});
	}

	private listenToScreenResize(): void {
		window.addEventListener('resize', () => this.resize());
	}

	private resize(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.objects.camera.aspect = width / height;
		this.objects.camera.updateProjectionMatrix();
	}

	public getObjectsToUpdateMesh(): RenderableObject3D[] {
		const objects: Object3D[] = [this.scene];
		const result: RenderableObject3D[] = [];

		while (objects.length > 0) {
			const object = objects.shift();

			objects.push(...object.children);

			if (object instanceof RenderableObject3D && !object.isMeshReady()) {
				result.push(object);
			}
		}

		return result;
	}

	private updateTiles(): void {
		const tiles = this.systemManager.getSystem(TileSystem).tiles;

		for (const tile of tiles.values()) {
			if (!tile.parent) {
				this.objects.wrapper.add(tile);
				this.objects.tiles.push(tile);
			}
		}

		for (let i = 0; i < this.objects.tiles.length; i++) {
			if (!this.objects.tiles[i].parent) {
				this.objects.tiles.splice(i, 1);
				--i;
			}
		}
	}

	public updateInstancedObjectsBuffers(
		tiles: Tile[],
		camera: Camera,
		origin: Vec2
	): void {
		for (const [name, instancedObject] of this.objects.instancedObjects.entries()) {
			const buffers: Float32Array[] = [];
			const config = Tile3DInstanceLODConfig[name as Tile3DInstanceType];
			let count = 0;

			for (const tile of tiles) {
				const bbox0 = tile.getInstancesBoundingBox(name as Tile3DInstanceType, 0);

				if (!bbox0) {
					continue;
				}

				if (
					camera.isFrustumIntersectsBoundingBox(bbox0.toSpace(tile.matrixWorld)) &&
					tile.distanceToCamera < config.LOD0MaxDistance
				) {
					const tileBuffer = tile.getInstanceBufferWithTransform(name as Tile3DInstanceType, 0, origin);

					if (tileBuffer) {
						buffers.push(tileBuffer);
						count++;
					}

					continue;
				}

				const bbox1 = tile.getInstancesBoundingBox(name as Tile3DInstanceType, 1);

				if (
					camera.isFrustumIntersectsBoundingBox(bbox1.toSpace(tile.matrixWorld)) &&
					tile.distanceToCamera < config.LOD1MaxDistance
				) {
					const tileBuffer = tile.getInstanceBufferWithTransform(name as Tile3DInstanceType, 1, origin);

					if (tileBuffer) {
						buffers.push(tileBuffer);
						count++;
					}
				}
			}

			instancedObject.position.set(origin.x, 0, origin.y);
			instancedObject.updateMatrix();
			instancedObject.updateMatrixWorld();

			const mergedBuffer = Utils.mergeTypedArrays(Float32Array, buffers);
			instancedObject.setInstancesInterleavedBuffer(mergedBuffer);
		}
	}

	public update(deltaTime: number): void {
		const cameraPos = this.objects.camera.position;

		this.pivotDelta = new Vec2(
			this.objects.wrapper.position.x + cameraPos.x,
			this.objects.wrapper.position.z + cameraPos.z
		);

		this.objects.wrapper.position.x = -cameraPos.x;
		this.objects.wrapper.position.z = -cameraPos.z;

		this.objects.wrapper.updateMatrix();

		this.objects.skybox.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
		this.objects.skybox.updateMatrix();

		const lightDirection = this.systemManager.getSystem(MapTimeSystem).lightDirection;
		const lightIntensity = this.systemManager.getSystem(MapTimeSystem).lightIntensity;

		this.objects.csm.direction = Vec3.clone(lightDirection);
		this.objects.csm.intensity = lightIntensity;
		this.objects.csm.update();

		this.updateTiles();

		this.scene.updateMatrixRecursively();
		this.scene.updateMatrixWorldRecursively();

		this.objects.camera.updateMatrixWorldInverse();
		this.objects.camera.updateFrustum();
	}
}