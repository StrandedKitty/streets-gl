import System from '~/app/System';
import Object3D from '~/core/Object3D';
import SystemManager from '../SystemManager';
import PerspectiveCamera from '~/core/PerspectiveCamera';
import Skybox from '~/app/objects/Skybox';
import RenderableObject3D from '~/app/objects/RenderableObject3D';
import Vec2 from '~/math/Vec2';
import TileSystem from '~/app/systems/TileSystem';
import Mat4 from '~/math/Mat4';

interface SceneObjects {
	wrapper: Object3D;
	camera: PerspectiveCamera;
	skybox: Skybox;
	tiles: Object3D;
}

export default class SceneSystem extends System {
	public scene: Object3D;
	public objects: SceneObjects;
	public pivotDelta: Vec2 = new Vec2();

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();

		window.addEventListener('resize', () => this.resize());
	}

	private init() {
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

		this.objects = {
			wrapper,
			camera,
			skybox,
			tiles
		};

		this.scene.add(wrapper);

		wrapper.add(camera);
		wrapper.add(skybox);
		wrapper.add(tiles);
	}

	public postInit() {

	}

	public getObjectsToUpdate(): RenderableObject3D[] {
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

	private updateTiles() {
		const tiles = this.systemManager.getSystem(TileSystem).tiles;

		for (const tile of tiles.values()) {
			if (!tile.ground && tile.readyForRendering && !tile.parent) {
				//tile.createGround(this.renderer, this.systemManager.getSystem(TileSystem).getTileNeighbors(tile.x, tile.y));
				//tile.generateMeshes(this.renderer);
				//this.wrapper.add(tile);
				this.objects.tiles.add(tile);
			}
		}
	}

	public update(deltaTime: number) {
		const cameraPos = this.objects.camera.position;

		this.objects.skybox.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
		this.objects.skybox.updateMatrix();

		this.pivotDelta = new Vec2(
			this.objects.wrapper.position.x + cameraPos.x,
			this.objects.wrapper.position.z + cameraPos.z
		);

		this.objects.wrapper.position.x = -cameraPos.x;
		this.objects.wrapper.position.z = -cameraPos.z;

		this.objects.wrapper.updateMatrix();

		this.updateTiles();

		this.scene.updateMatrixWorldRecursively();

		this.objects.camera.updateMatrixWorldInverse();
		this.objects.camera.updateFrustum();
	}

	private resize() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.objects.camera.aspect = width / height;
		this.objects.camera.updateProjectionMatrix();
	}
}