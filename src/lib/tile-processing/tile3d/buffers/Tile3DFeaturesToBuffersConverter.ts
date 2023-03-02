import Tile3DBuffers, {
	BoundingBox,
	Tile3DBuffersExtruded,
	Tile3DBuffersProjected
} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Utils from "~/app/Utils";
import AABB3D from "~/lib/math/AABB3D";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";

export class Tile3DFeaturesToBuffersConverter {
	public static convert(collection: Tile3DFeatureCollection): Tile3DBuffers {
		return {
			extruded: this.getExtrudedBuffers(collection.extruded),
			projected: this.getProjectedBuffers(collection.projected),
			instances: {}
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

	private static joinBoundingBoxes(features: {boundingBox: AABB3D}[]): AABB3D {
		const joined = new AABB3D();

		for (const feature of features) {
			joined.includeAABB(feature.boundingBox);
		}

		return joined;
	}

	private static sortProjectedFeatures(features: Tile3DProjectedGeometry[]): Tile3DProjectedGeometry[] {
		return features.sort((a, b) => {
			return b.zIndex - a.zIndex;
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