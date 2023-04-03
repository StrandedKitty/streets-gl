import Tile3DBuffers, {
	BoundingBox,
	Tile3DBuffersExtruded, Tile3DBuffersHugging, Tile3DBuffersInstance, Tile3DBuffersLabels,
	Tile3DBuffersProjected
} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Utils from "~/app/Utils";
import AABB3D from "~/lib/math/AABB3D";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DHuggingGeometry from "~/lib/tile-processing/tile3d/features/Tile3DHuggingGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Vec3 from "~/lib/math/Vec3";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";

export class Tile3DFeaturesToBuffersConverter {
	public static convert(collection: Tile3DFeatureCollection): Tile3DBuffers {
		return {
			extruded: this.getExtrudedBuffers(collection.extruded),
			projected: this.getProjectedBuffers(collection.projected),
			hugging: this.getHuggingBuffers(collection.hugging),
			labels: this.getLabelsBuffers(collection.labels),
			instances: this.getInstanceBuffers(collection.instances)
		};
	}

	private static getExtrudedBuffers(features: Tile3DExtrudedGeometry[]): Tile3DBuffersExtruded {
		const positionBuffers: Float32Array[] = [];
		const uvBuffers: Float32Array[] = [];
		const normalBuffers: Float32Array[] = [];
		const textureIdBuffers: Uint8Array[] = [];
		const colorBuffers: Uint8Array[] = [];

		for (const feature of features) {
			positionBuffers.push(feature.positionBuffer);
			uvBuffers.push(feature.uvBuffer);
			normalBuffers.push(feature.normalBuffer);
			textureIdBuffers.push(feature.textureIdBuffer);
			colorBuffers.push(feature.colorBuffer);
		}

		const positionBufferMerged = Utils.mergeTypedArrays(Float32Array, positionBuffers);
		const uvBufferMerged = Utils.mergeTypedArrays(Float32Array, uvBuffers);
		const normalBufferMerged = Utils.mergeTypedArrays(Float32Array, normalBuffers);
		const textureIdBufferMerged = Utils.mergeTypedArrays(Uint8Array, textureIdBuffers);
		const colorBufferMerged = Utils.mergeTypedArrays(Uint8Array, colorBuffers);

		const offsetBuffer = new Uint32Array(features.length);
		const idBuffer = new Uint32Array(features.length * 2);
		const localIdBuffers: Uint32Array[] = [];
		let totalVertexCount: number = 0;

		for (let i = 0; i < features.length; i++) {
			const feature = features[i];
			const vertexCount = feature.positionBuffer.length / 3;

			idBuffer[i * 2] = feature.idBuffer[0];
			idBuffer[i * 2 + 1] = feature.idBuffer[1];
			offsetBuffer[i] = totalVertexCount;

			totalVertexCount += vertexCount;

			localIdBuffers.push(Utils.fillTypedArraySequence(new Uint32Array(vertexCount), new Uint32Array([i])));
		}

		const localIdBuffer = Utils.mergeTypedArrays(Uint32Array, localIdBuffers);

		return {
			positionBuffer: positionBufferMerged,
			uvBuffer: uvBufferMerged,
			normalBuffer: normalBufferMerged,
			textureIdBuffer: textureIdBufferMerged,
			colorBuffer: colorBufferMerged,
			idBuffer: idBuffer,
			offsetBuffer: offsetBuffer,
			localIdBuffer: localIdBuffer,
			boundingBox: this.boundingBoxToFlatObject(this.joinBoundingBoxes(features))
		};
	}

	private static getProjectedBuffers(features: Tile3DProjectedGeometry[]): Tile3DBuffersProjected {
		const sortedFeatures = this.sortProjectedFeatures(features);

		const boundingBox = this.joinBoundingBoxes(sortedFeatures);
		boundingBox.min.y = -1000;
		boundingBox.max.y = 100000;

		const positionBuffers: Float32Array[] = [];
		const uvBuffers: Float32Array[] = [];
		const normalBuffers: Float32Array[] = [];
		const textureIdBuffers: Uint8Array[] = [];

		for (const feature of sortedFeatures) {
			positionBuffers.push(feature.positionBuffer);
			uvBuffers.push(feature.uvBuffer);
			normalBuffers.push(feature.normalBuffer);
			textureIdBuffers.push(feature.textureIdBuffer);
		}

		const positionBufferMerged = Utils.mergeTypedArrays(Float32Array, positionBuffers);
		const uvBufferMerged = Utils.mergeTypedArrays(Float32Array, uvBuffers);
		const normalBufferMerged = Utils.mergeTypedArrays(Float32Array, normalBuffers);
		const textureIdBufferMerged = Utils.mergeTypedArrays(Uint8Array, textureIdBuffers);

		return {
			positionBuffer: positionBufferMerged,
			normalBuffer: normalBufferMerged,
			uvBuffer: uvBufferMerged,
			textureIdBuffer: textureIdBufferMerged,
			boundingBox: this.boundingBoxToFlatObject(boundingBox)
		};
	}

	private static getHuggingBuffers(features: Tile3DHuggingGeometry[]): Tile3DBuffersHugging {
		const boundingBox = this.joinBoundingBoxes(features);
		boundingBox.min.y = -1000;
		boundingBox.max.y = 100000;

		const positionBuffers: Float32Array[] = [];
		const uvBuffers: Float32Array[] = [];
		const normalBuffers: Float32Array[] = [];
		const textureIdBuffers: Uint8Array[] = [];

		for (const feature of features) {
			positionBuffers.push(feature.positionBuffer);
			uvBuffers.push(feature.uvBuffer);
			normalBuffers.push(feature.normalBuffer);
			textureIdBuffers.push(feature.textureIdBuffer);
		}

		const positionBufferMerged = Utils.mergeTypedArrays(Float32Array, positionBuffers);
		const uvBufferMerged = Utils.mergeTypedArrays(Float32Array, uvBuffers);
		const normalBufferMerged = Utils.mergeTypedArrays(Float32Array, normalBuffers);
		const textureIdBufferMerged = Utils.mergeTypedArrays(Uint8Array, textureIdBuffers);

		return {
			positionBuffer: positionBufferMerged,
			normalBuffer: normalBufferMerged,
			uvBuffer: uvBufferMerged,
			textureIdBuffer: textureIdBufferMerged,
			boundingBox: this.boundingBoxToFlatObject(boundingBox)
		};
	}

	private static getLabelsBuffers(features: Tile3DLabel[]): Tile3DBuffersLabels {
		const positionArray: number[] = [];
		const priorityArray: number[] = [];
		const textArray: string[] = [];
		const boundingBox = new AABB3D();

		for (const feature of features) {
			const position = new Vec3(feature.position[0], feature.position[1], feature.position[2]);

			positionArray.push(position.x, position.y, position.z);
			priorityArray.push(feature.priority);
			textArray.push(feature.text);
			boundingBox.includePoint(position);
		}

		return {
			position: new Float32Array(positionArray),
			priority: new Float32Array(priorityArray),
			text: textArray,
			boundingBox: this.boundingBoxToFlatObject(boundingBox)
		};
	}

	private static getInstanceBuffers(features: Tile3DInstance[]): Record<string, Tile3DBuffersInstance> {
		const collections: Map<string, Tile3DInstance[]> = new Map();

		for (const feature of features) {
			if (!collections.has(feature.instanceType)) {
				collections.set(feature.instanceType, []);
			}

			collections.get(feature.instanceType).push(feature);
		}

		const buffers: Record<string, Tile3DBuffersInstance> = {};

		for (const [name, collection] of collections.entries()) {
			const instanceCount = collection.length;
			const instanceCountHalf = Math.floor(instanceCount / 2);

			const interleavedArray: Float32Array = new Float32Array(instanceCount * 5);
			const interleavedArrayHalf: Float32Array = new Float32Array(instanceCountHalf * 5);

			for (let i = 0; i < instanceCount; i++) {
				const feature = collection[i];

				interleavedArray[i * 5] = feature.x;
				interleavedArray[i * 5 + 1] = feature.y;
				interleavedArray[i * 5 + 2] = feature.z;
				interleavedArray[i * 5 + 3] = feature.scale;
				interleavedArray[i * 5 + 4] = feature.rotation;

				if (i < instanceCountHalf) {
					interleavedArrayHalf[i * 5] = feature.x;
					interleavedArrayHalf[i * 5 + 1] = feature.y;
					interleavedArrayHalf[i * 5 + 2] = feature.z;
					interleavedArrayHalf[i * 5 + 3] = feature.scale;
					interleavedArrayHalf[i * 5 + 4] = feature.rotation;
				}
			}

			buffers[name] = {
				interleavedBufferLOD0: interleavedArray,
				interleavedBufferLOD1: interleavedArrayHalf
			};
		}

		return buffers;
	}

	private static joinBoundingBoxes(features: {boundingBox: AABB3D}[]): AABB3D {
		const joined = new AABB3D();

		for (const feature of features) {
			joined.includeAABB(feature.boundingBox);
		}

		return joined;
	}

	private static sortProjectedFeatures(features: Tile3DProjectedGeometry[]): Tile3DProjectedGeometry[] {
		return features.sort((a, b) => {
			return a.zIndex - b.zIndex;
		});
	}

	private static boundingBoxToFlatObject(box: AABB3D): BoundingBox {
		return {
			minX: box.min.x,
			minY: box.min.y,
			minZ: box.min.z,
			maxX: box.max.x,
			maxY: box.max.y,
			maxZ: box.max.z
		};
	}
}