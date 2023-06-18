import Tile3DBuffers, {
	BoundingBox,
	Tile3DBuffersExtruded,
	Tile3DBuffersHugging,
	Tile3DBuffersInstance,
	Tile3DBuffersLabels,
	Tile3DBuffersProjected, Tile3DTerrainMask
} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Utils from "~/app/Utils";
import AABB3D from "~/lib/math/AABB3D";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DHuggingGeometry from "~/lib/tile-processing/tile3d/features/Tile3DHuggingGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Vec3 from "~/lib/math/Vec3";
import Tile3DInstance, {
	InstanceStructureSchemas,
	LODConfig,
	Tile3DInstanceLODConfig,
	Tile3DInstanceType
} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Tile3DTerrainMaskGeometry from "~/lib/tile-processing/tile3d/features/Tile3DTerrainMaskGeometry";

const getRandom = <T>(arr: T[], n: number): T[] => {
	let result = new Array<T>(n),
		len = arr.length,
		taken = new Array(len);
	if (n > len)
		throw new RangeError("getRandom: more elements taken than available");
	while (n--) {
		const x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result;
}

export class Tile3DFeaturesToBuffersConverter {
	public static convert(collection: Tile3DFeatureCollection): Tile3DBuffers {
		return {
			extruded: this.getExtrudedBuffers(collection.extruded),
			projected: this.getProjectedBuffers(collection.projected),
			hugging: this.getHuggingBuffers(collection.hugging),
			terrainMask: this.getTerrainMaskBuffers(collection.terrainMask, collection.zoom),
			labels: this.getLabelsBuffers(collection.labels),
			instances: this.getInstanceBuffers(collection.instances)
		};
	}

	// If multiple extruded geometries (buildings) have the same OSM ref, merge them into one geometry.
	// This is required for the ownership system to work properly. Unless we do this, multipolygons with multiple
	// outlines are not going to be treated as single buildings when doing GPU picking or hiding/showing buildings using
	// the ownership system.
	private static mergeExtrudedGeometriesWithSameOsmRef(features: Tile3DExtrudedGeometry[]): void {
		const featureMap = new Map<number, Tile3DExtrudedGeometry[]>();

		for (const feature of features) {
			const key = feature.idBuffer[0];

			if (!featureMap.has(key)) {
				featureMap.set(key, []);
			}

			featureMap.get(key).push(feature);
		}

		const featuresToRemove: Tile3DExtrudedGeometry[] = [];

		for (const feature of features) {
			const key = feature.idBuffer[0];
			const featuresWithSameId = featureMap.get(key);

			if (!featuresWithSameId.includes(feature)) {
				continue;
			}

			const featuresToMerge = featuresWithSameId
				.filter(f => f !== feature)
				.filter(f => f.idBuffer[1] === feature.idBuffer[1])

			if (featuresToMerge.length === 0) {
				continue;
			}

			for (const other of featuresToMerge) {
				this.mergeExtrudedGeometries(feature, other);

				featuresWithSameId.splice(featuresWithSameId.indexOf(other), 1);
				featuresToRemove.push(other);
			}
		}

		for (const feature of featuresToRemove) {
			features.splice(features.indexOf(feature), 1);
		}
	}

	private static mergeExtrudedGeometries(geom0: Tile3DExtrudedGeometry, geom1: Tile3DExtrudedGeometry): void {
		geom0.boundingBox.includeAABB(geom1.boundingBox);
		geom0.positionBuffer = Utils.mergeTypedArrays(Float32Array, [geom0.positionBuffer, geom1.positionBuffer]);
		geom0.uvBuffer = Utils.mergeTypedArrays(Float32Array, [geom0.uvBuffer, geom1.uvBuffer]);
		geom0.normalBuffer = Utils.mergeTypedArrays(Float32Array, [geom0.normalBuffer, geom1.normalBuffer]);
		geom0.textureIdBuffer = Utils.mergeTypedArrays(Uint8Array, [geom0.textureIdBuffer, geom1.textureIdBuffer]);
		geom0.colorBuffer = Utils.mergeTypedArrays(Uint8Array, [geom0.colorBuffer, geom1.colorBuffer]);
	}

	private static getExtrudedBuffers(features: Tile3DExtrudedGeometry[]): Tile3DBuffersExtruded {
		this.mergeExtrudedGeometriesWithSameOsmRef(features);

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

	private static getTerrainMaskBuffers(features: Tile3DTerrainMaskGeometry[], zoom: number): Tile3DTerrainMask {
		const tileSize = 40075016.68 / (1 << zoom);
		const positionBuffers: Float32Array[] = [];

		for (const feature of features) {
			positionBuffers.push(feature.positionBuffer);
		}

		const positionBufferMerged = Utils.mergeTypedArrays(Float32Array, positionBuffers);

		for (let i = 0; i < positionBufferMerged.length; i += 1) {
			positionBufferMerged[i] /= tileSize;
		}

		return {positionBuffer: positionBufferMerged};
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
		const collections: Map<Tile3DInstanceType, Tile3DInstance[]> = new Map();

		for (const feature of features) {
			if (!collections.has(feature.instanceType)) {
				collections.set(feature.instanceType, []);
			}

			collections.get(feature.instanceType).push(feature);
		}

		const buffers: Record<string, Tile3DBuffersInstance> = {};

		for (const [name, collection] of collections.entries()) {
			const lodConfig = Tile3DInstanceLODConfig[name];
			const lods = Tile3DFeaturesToBuffersConverter.getInstancesBuffers(collection, lodConfig);

			buffers[name] = {
				interleavedBufferLOD0: lods[0],
				interleavedBufferLOD1: lods[1]
			};
		}

		return buffers;
	}

	private static getInstancesBuffers(instances: Tile3DInstance[], config: LODConfig): [Float32Array, Float32Array] {
		const halfInstances = config.LOD1Fraction > 0 ?
			this.clearInstancesWithHeatMap(instances, 12, config.LOD1Fraction) : [];

		return [
			this.createInstanceInterleavedBuffer(instances, config),
			this.createInstanceInterleavedBuffer(halfInstances, config)
		];
	}

	private static clearInstancesWithHeatMap(
		instances: Tile3DInstance[],
		resolution: number,
		factor: number
	): Tile3DInstance[] {
		const TileSize = 611.4962158203125;
		const heatMap: Tile3DInstance[][] = new Array(resolution ** 2).fill(null).map(() => []);

		for (const instance of instances) {
			const x = instance.x / TileSize * resolution;
			const y = instance.z / TileSize * resolution;
			const index = Math.floor(x) + Math.floor(y) * resolution;

			heatMap[index].push(instance);
		}

		const cleared: Tile3DInstance[] = [];

		for (const cell of heatMap) {
			if (cell.length === 0) {
				continue;
			}

			const newCount = Math.max(Math.round(cell.length * factor), 1);
			cleared.push(...getRandom(cell, newCount));
		}

		return cleared;
	}

	private static createInstanceInterleavedBuffer(instances: Tile3DInstance[], config: LODConfig): Float32Array {
		const schema = InstanceStructureSchemas[config.structure];
		const buffer = new Float32Array(instances.length * schema.componentsPerInstance);

		for (let i = 0; i < instances.length; i++) {
			const feature = instances[i];
			const components = schema.getComponents(feature);

			for (let j = 0; j < schema.componentsPerInstance; j++) {
				buffer[i * schema.componentsPerInstance + j] = components[j];
			}
		}

		return buffer;
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