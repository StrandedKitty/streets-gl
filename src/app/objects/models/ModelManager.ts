import ResourceLoader from "../../world/ResourceLoader";
import AABB3D from "~/lib/math/AABB3D";
import Vec3 from "~/lib/math/Vec3";

export interface ModelSourceBuffers {
	position: Float32Array;
	normal: Float32Array;
	uv: Float32Array;
	indices: Uint32Array;
	boundingBox: AABB3D;
}

export default class ModelManager {
	public static getGLTFModel(name: string): ModelSourceBuffers {
		const gltf = ResourceLoader.get(name);

		const mesh = gltf.meshes[0];
		const primitive = mesh.primitives[0];
		const positionBuffer = <Float32Array>primitive.attributes.POSITION.value;
		const normalBuffer = <Float32Array>primitive.attributes.NORMAL.value;
		const uvBuffer = <Float32Array>primitive.attributes.TEXCOORD_0.value;
		const indexBuffer = primitive.indices.value;

		const bboxMin = primitive.attributes.POSITION.min as number[];
		const bboxMax = primitive.attributes.POSITION.max as number[];

		return {
			position: positionBuffer,
			normal: normalBuffer,
			uv: uvBuffer,
			indices: indexBuffer instanceof Uint16Array ? new Uint32Array(indexBuffer) : indexBuffer,
			boundingBox: new AABB3D(
				new Vec3(bboxMin[0], bboxMin[1], bboxMin[2]),
				new Vec3(bboxMax[0], bboxMax[1], bboxMax[2])
			)
		}
	}
}