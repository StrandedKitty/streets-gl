import {InstanceBuffers} from "../InstancedGenericObject";
import ResourceManager from "../../world/ResourceManager";

export default class ModelManager {
	public static getGLTFModel(name: string): InstanceBuffers {
		const gltf = ResourceManager.get(name);
		const mesh = gltf.meshes[0];
		const primitive = mesh.primitives[0];
		const positionBuffer = <Float32Array>primitive.attributes.POSITION.value;
		const normalBuffer = <Float32Array>primitive.attributes.NORMAL.value;
		const uvBuffer = <Float32Array>primitive.attributes.TEXCOORD_0.value;
		const indexBuffer = primitive.indices.value;

		return {
			position: positionBuffer,
			normal: normalBuffer,
			uv: uvBuffer,
			indices: indexBuffer instanceof Uint16Array ? new Uint32Array(indexBuffer) : indexBuffer
		}
	}
}