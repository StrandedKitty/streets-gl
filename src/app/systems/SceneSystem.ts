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
import InstancedObject from "../objects/InstancedObject";
import ModelManager from "../objects/models/ModelManager";
import InstancedAircraft from "../objects/InstancedAircraft";
import Terrain from "../objects/Terrain";
import Tile from "~/app/objects/Tile";
import SettingsSystem from "~/app/systems/SettingsSystem";

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
			cascades: Config.ShadowCascades,
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

		this.objects.instancedObjects.set('tree', new InstancedObject(ModelManager.getGLTFModel('treeModel')));
		this.objects.instancedObjects.set('adColumn', new InstancedObject(ModelManager.getGLTFModel('adColumn')));
		this.objects.instancedObjects.set('transmissionTower', new InstancedObject(ModelManager.getGLTFModel('transmissionTower')));
		this.objects.instancedObjects.set('hydrant', new InstancedObject(ModelManager.getGLTFModel('hydrant')));
		this.objects.instancedObjects.set('trackedCrane', new InstancedObject(ModelManager.getGLTFModel('trackedCrane')));
		this.objects.instancedObjects.set('towerCrane', new InstancedObject(ModelManager.getGLTFModel('towerCrane')));

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
			const {camera, csm} = this.objects;

			camera.fov = numberValue;
			camera.updateProjectionMatrix();
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