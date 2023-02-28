import Tile3DBuffers, {BoundingBox} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Utils from "~/app/Utils";
import AABB3D from "~/lib/math/AABB3D";

export class Tile3DFeaturesToBuffersConverter {
	public static convert(collection: Tile3DFeatureCollection): Tile3DBuffers {
		const extrudedBoundingBox = new AABB3D();

		for (const geometry of collection.extruded) {
			extrudedBoundingBox.includeAABB(geometry.boundingBox);
		}

		const positionBufferExtruded = Utils.mergeTypedArrays(
			Float32Array,
			collection.extruded.map(f => f.positionBuffer)
		);
		const uvBufferExtruded = Utils.mergeTypedArrays(
			Float32Array,
			collection.extruded.map(f => f.uvBuffer)
		);
		const normalBufferExtruded = Utils.mergeTypedArrays(
			Float32Array,
			collection.extruded.map(f => f.normalBuffer)
		);
		const textureIdBufferExtruded = Utils.mergeTypedArrays(
			Uint8Array,
			collection.extruded.map(f => f.textureIdBuffer)
		);
		const colorBufferExtruded = Utils.mergeTypedArrays(
			Uint8Array,
			collection.extruded.map(f => f.colorBuffer)
		);

		const offsetBufferExtruded = new Uint32Array(collection.extruded.length);
		const idBufferExtruded = new Uint32Array(collection.extruded.length * 2);
		const localIdBuffers: Uint32Array[] = [];
		let totalVertexCount: number = 0;

		for (let i = 0; i < collection.extruded.length; i++) {
			const feature = collection.extruded[i];
			const vertexCount = feature.positionBuffer.length / 3;

			idBufferExtruded[i * 2] = feature.idBuffer[0];
			idBufferExtruded[i * 2 + 1] = feature.idBuffer[1];
			offsetBufferExtruded[i] = totalVertexCount;

			totalVertexCount += vertexCount;

			localIdBuffers.push(Utils.fillTypedArraySequence(new Uint32Array(vertexCount), new Uint32Array([i])));
		}

		const localIdBufferExtruded = Utils.mergeTypedArrays(Uint32Array, localIdBuffers);

		const projectedBoundingBox = new AABB3D();

		for (const geometry of collection.projected) {
			projectedBoundingBox.includeAABB(geometry.boundingBox);
		}
		projectedBoundingBox.min.y = -1000;
		projectedBoundingBox.max.y = 100000;

		const positionBufferProjected = Utils.mergeTypedArrays(
			Float32Array,
			collection.projected.map(f => f.positionBuffer)
		);
		const normalBufferProjected = Utils.mergeTypedArrays(
			Float32Array,
			collection.projected.map(f => f.normalBuffer)
		);
		const uvBufferProjected = Utils.mergeTypedArrays(
			Float32Array,
			collection.projected.map(f => f.uvBuffer)
		);
		const textureIdBufferProjected = Utils.mergeTypedArrays(
			Uint8Array,
			collection.projected.map(f => f.textureIdBuffer)
		);

		return {
			extruded: {
				positionBuffer: positionBufferExtruded,
				uvBuffer: uvBufferExtruded,
				normalBuffer: normalBufferExtruded,
				textureIdBuffer: textureIdBufferExtruded,
				colorBuffer: colorBufferExtruded,
				idBuffer: idBufferExtruded,
				offsetBuffer: offsetBufferExtruded,
				localIdBuffer: localIdBufferExtruded,
				boundingBox: this.boundingBoxToFlatObject(extrudedBoundingBox)
			},
			projected: {
				positionBuffer: positionBufferProjected,
				normalBuffer: normalBufferProjected,
				uvBuffer: uvBufferProjected,
				textureIdBuffer: textureIdBufferProjected,
				boundingBox: this.boundingBoxToFlatObject(projectedBoundingBox)
			},
			instances: {}
		};
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