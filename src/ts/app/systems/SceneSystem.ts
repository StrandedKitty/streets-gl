import System from '~/app/System';
import Object3D from '~/core/Object3D';
import SystemManager from '../SystemManager';
import PerspectiveCamera from '~/core/PerspectiveCamera';
import Skybox from '~/app/objects/Skybox';
import RenderableObject3D from '~/app/objects/RenderableObject3D';
import Vec2 from '~/math/Vec2';
import TileSystem from '~/app/systems/TileSystem';
import CSM from "~/app/render/CSM";
import Config from "~/app/Config";

interface SceneObjects {
	wrapper: Object3D;
	camera: PerspectiveCamera;
	skybox: Skybox;
	tiles: Object3D;
	csm: CSM;
}

export default class SceneSystem extends System {
	public scene: Object3D;
	public objects: SceneObjects;
	public pivotDelta: Vec2 = new Vec2();

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();

		window.addEventListener('resize', () => this.resize());
	}

	private init(): void {
		this.scene = new Object3D();

		const wrapper = new Object3D();
		const camera = new PerspectiveCamera({
			fov: 40,
			near: 10,
			far: 25000,
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

		this.objects = {
			wrapper,
			camera,
			skybox,
			tiles,
			csm
		};

		this.scene.add(wrapper);
		wrapper.add(camera, csm, skybox, tiles);
	}

	public postInit(): void {

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
				this.objects.tiles.add(tile);
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

		this.objects.csm.update();

		this.updateTiles();

		this.scene.updateMatrixRecursively();
		this.scene.updateMatrixWorldRecursively();

		this.objects.camera.updateMatrixWorldInverse();
		this.objects.camera.updateFrustum();
	}

	private resize(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.objects.camera.aspect = width / height;
		this.objects.camera.updateProjectionMatrix();
		this.objects.csm.updateFrustums();
	}
}