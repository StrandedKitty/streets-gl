import Object3D from "../../core/Object3D";
import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Vec3 from "../../math/Vec3";
import DirectionalLightShadow from "../../renderer/DirectionalLightShadow";
import Frustum from "../../core/Frustum";
import AABB from "../../core/AABB";
import Material, {UniformType} from "../../renderer/Material";

const ShadowCameraTopOffset: number = 2000;

export default class CSM extends Object3D {
	private readonly renderer: Renderer;
	private camera: PerspectiveCamera;
	private near: number;
	private far: number;
	private cascades: number;
	private resolution: number;
	private shadowBias: number;
	public direction: Vec3;

	public lights: DirectionalLightShadow[] = [];
	private mainFrustum: Frustum;
	private frustums: Frustum[];
	private breaks: number[];

	constructor(renderer: Renderer, {
		camera,
		parent,
		near,
		far,
		cascades,
		resolution,
		shadowBias,
		direction = new Vec3(-1, -2, -1)
	}: {
		camera: PerspectiveCamera,
		parent: Object3D,
		near: number,
		far: number,
		cascades: number,
		resolution: number,
		shadowBias?: number,
		direction?: Vec3
	}) {
		super();

		this.renderer = renderer;
		this.camera = camera;
		this.near = near;
		this.far = far;
		this.cascades = cascades;
		this.resolution = resolution;
		this.shadowBias = shadowBias;
		this.direction = direction;

		parent.add(this);

		this.createLights();
		this.updateBreaks();
		this.createFrustums();
	}

	private createLights() {
		for (let i = 0; i < this.cascades; i++) {
			const light = new DirectionalLightShadow(this.renderer, {
				resolution: this.resolution,
				size: 0,
				near: 1,
				far: 10000
			});

			this.add(light);
			this.lights.push(light);
		}
	}

	private createFrustums() {
		this.mainFrustum = new Frustum(this.camera.fov, this.camera.aspect, this.near, this.far);

		this.mainFrustum.updateViewSpaceVertices();

		const newFrustumsVertices = this.mainFrustum.split(this.breaks);

		this.frustums = [];

		for (const vertices of newFrustumsVertices) {
			const frustum = new Frustum();

			frustum.setVertices(vertices);
			this.frustums.push(frustum);
		}
	}

	private updateBreaks() {
		this.breaks = CSM.practicalSplit(this.cascades, this.near, this.far, 0.5);
	}

	public update() {
		for (let i = 0; i < this.frustums.length; i++) {
			const worldSpaceFrustum = this.frustums[i].toSpace(this.camera.matrix);
			const light = this.lights[i];

			light.camera.updateMatrixWorld();
			light.camera.updateMatrixWorldInverse();

			const lightSpaceFrustum = worldSpaceFrustum.toSpace(light.camera.matrixWorldInverse);
			const bbox = (new AABB()).fromFrustum(lightSpaceFrustum);

			const bboxDims = bbox.getSize();
			const bboxSideSize = Math.max(bboxDims.x, bboxDims.y);
			let bboxCenter = bbox.getCenter();

			bboxCenter.z = bbox.max.z + ShadowCameraTopOffset;

			bboxCenter = Vec3.applyMatrix4(bboxCenter, light.camera.matrixWorld);

			light.camera.left = -bboxSideSize / 2;
			light.camera.right = bboxSideSize / 2;
			light.camera.top = bboxSideSize / 2;
			light.camera.bottom = -bboxSideSize / 2;

			light.camera.updateProjectionMatrix();

			light.position.set(bboxCenter.x, bboxCenter.y, bboxCenter.z);

			const target = Vec3.add(bboxCenter, this.direction);
			light.lookAt(target);

			light.updateMatrixWorld();
			light.camera.updateMatrixWorld();
			light.camera.updateMatrixWorldInverse();
		}
	}

	public updateFrustums() {
		this.createFrustums();
	}

	private getBreaksForUniform(): number[] {
		const breaks = [this.near];

		for(let i = 0; i < this.breaks.length; i++) {
			breaks.push(this.breaks[i] * this.far);
		}

		return breaks;
	}

	public applyUniformsToMaterial(material: Material) {
		for (let i = 0; i < this.cascades; i++) {
			material.uniforms[`cascades[${i}].shadowMap`] = {
				type: UniformType.Texture2D,
				value: this.lights[i].texture
			};
			material.uniforms[`cascades[${i}].matrixWorldInverse`] = {
				type: UniformType.Matrix4,
				value: this.lights[i].camera.matrixWorldInverse
			};
			material.uniforms[`cascades[${i}].resolution`] = {
				type: UniformType.Float1,
				value: this.lights[i].resolution
			};
			material.uniforms[`cascades[${i}].size`] = {
				type: UniformType.Float1,
				value: this.lights[i].camera.top
			};
			material.uniforms[`cascades[${i}].bias`] = {
				type: UniformType.Float1,
				value: this.shadowBias * this.lights[i].camera.top
			};
			material.uniforms[`shadowSplits`] = {
				type: UniformType.Float1Array,
				value: new Float32Array(this.getBreaksForUniform())
			};
		}
	}

	private static uniformSplit(splits: number, near: number, far: number): number[] {
		const r = [];

		for (let i = 1; i < splits; i++) {
			r.push((near + (far - near) * i / splits) / far);
		}

		r.push(1);

		return r;
	}

	private static logarithmicSplit(splits: number, near: number, far: number): number[] {
		const r = [];

		for (let i = 1; i < splits; i++) {
			r.push((near * (far / near) ** (i / splits)) / far);
		}

		r.push(1);

		return r;
	}

	private static practicalSplit(splits: number, near: number, far: number, lambda: number): number[] {
		const log = CSM.logarithmicSplit(splits, near, far);
		const uni = CSM.uniformSplit(splits, near, far);
		const r = [];

		for (let i = 1; i < splits; i++) {
			r.push(lambda * log[i - 1] + (1 - lambda) * uni[i - 1]);
		}

		r.push(1);

		return r;
	}
}