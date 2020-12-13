import Object3D from "../../core/Object3D";
import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Vec3 from "../../math/Vec3";
import DirectionalLightShadow from "./DirectionalLightShadow";
import Frustum from "../../core/Frustum";
import AABB from "../../core/AABB";
import Material, {UniformType} from "../../renderer/Material";
import Texture2DArray from "../../renderer/Texture2DArray";
import GLConstants from "../../renderer/GLConstants";

const ShadowCameraTopOffset: number = 2000;
const FadeOffsetFactor: number = 250;

export default class CSM extends Object3D {
	private readonly renderer: Renderer;
	private camera: PerspectiveCamera;
	private near: number;
	private far: number;
	private cascades: number;
	private resolution: number;
	private shadowBias: number;
	private shadowNormalBias: number;
	public direction: Vec3;
	public lightIntensity: number = 0;
	public ambientLightIntensity: number = 0;

	public lights: DirectionalLightShadow[] = [];
	private texture: Texture2DArray;
	private mainFrustum: Frustum;
	private frustums: Frustum[];
	private breaks: number[][];
	private fadeOffsets: number[];

	constructor(renderer: Renderer, {
		camera,
		parent,
		near,
		far,
		cascades,
		resolution,
		shadowBias,
		shadowNormalBias,
		direction = new Vec3(-1, -1, -1)
	}: {
		camera: PerspectiveCamera,
		parent: Object3D,
		near: number,
		far: number,
		cascades: number,
		resolution: number,
		shadowBias: number,
		shadowNormalBias: number,
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
		this.shadowNormalBias = shadowNormalBias;
		this.direction = direction;

		parent.add(this);

		this.createLights();
		this.updateBreaks();
		this.createFrustums();
	}

	private createLights() {
		this.texture = new Texture2DArray(this.renderer, {
			width: this.resolution,
			height: this.resolution,
			depth: this.cascades,
			minFilter: GLConstants.NEAREST,
			magFilter: GLConstants.NEAREST,
			wrap: GLConstants.CLAMP_TO_EDGE,
			internalFormat: GLConstants.DEPTH_COMPONENT32F,
			format: GLConstants.DEPTH_COMPONENT,
			type: GLConstants.FLOAT
		});

		for (let i = 0; i < this.cascades; i++) {
			const light = new DirectionalLightShadow(this.renderer, {
				resolution: this.resolution,
				size: 0,
				near: 1,
				far: 10000,
				textureArray: this.texture,
				textureLayer: i
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
		const breaks = CSM.practicalSplit(this.cascades, this.near, this.far, 0.5);

		this.breaks = [];
		this.fadeOffsets = [];

		for (let i = 0; i < breaks.length; i++) {
			const prevBreak = i === 0 ? 0 : breaks[i - 1];

			this.fadeOffsets.push(breaks[i] * FadeOffsetFactor);
			this.breaks.push([prevBreak, breaks[i] + this.fadeOffsets[i] / (this.far - this.near)])
		}
	}

	public update() {
		this.direction = Vec3.normalize(this.direction);

		for (let i = 0; i < this.frustums.length; i++) {
			const worldSpaceFrustum = this.frustums[i].toSpace(this.camera.matrix);
			const light = this.lights[i];

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

	private getBreaksForUniform(): Float32Array {
		const worldSpaceBreaks = [];

		for (let i = 0; i < this.breaks.length; i++) {
			worldSpaceBreaks.push(this.breaks[i][0] * (this.far - this.near));
			worldSpaceBreaks.push(this.breaks[i][1] * (this.far - this.near));
		}

		return new Float32Array(worldSpaceBreaks);
	}

	public applyUniformsToMaterial(material: Material) {
		material.uniforms[`shadowMap`] = {
			type: UniformType.Texture2DArray,
			value: this.texture
		};

		material.uniforms[`uLight.direction`].value = Vec3.toArray(this.direction);
		material.uniforms[`uLight.intensity`].value = this.lightIntensity;
		material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

		for (let i = 0; i < this.cascades; i++) {
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
				type: UniformType.Float2,
				value: new Float32Array([
					this.shadowBias * this.lights[i].camera.top,
					this.shadowNormalBias * this.lights[i].camera.top
				])
			};
			material.uniforms[`cascades[${i}].fadeOffset`] = {
				type: UniformType.Float1,
				value: this.fadeOffsets[i]
			};
			material.uniforms[`shadowSplits`] = {
				type: UniformType.Float2,
				value: this.getBreaksForUniform()
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