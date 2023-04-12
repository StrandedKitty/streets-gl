import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import Tile from "./Tile";
import Vec3 from "~/lib/math/Vec3";
import TileLabelBuffers from "./TileLabelBuffers";
import Camera from "~/lib/core/Camera";
import Utils from "../Utils";
import RBush from 'rbush';
import Vec2 from "~/lib/math/Vec2";

interface AttributeBuffers {
	position: Float32Array;
	offset: Float32Array;
	uv: Float32Array;
	index: Uint32Array;
}

const DeclutterPaddingX = 10;
const DeclutterPaddingY = 20;

export default class Labels extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	public attributeBuffers: AttributeBuffers = {
		position: null,
		offset: null,
		uv: null,
		index: null
	};
	private attributeBuffersDirty: boolean = false;
	private tree: RBush<any> = new RBush<any>();

	public constructor() {
		super();
	}

	public isMeshReady(): boolean {
		return this.mesh !== null && !this.attributeBuffersDirty;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.mesh) {
			this.mesh = renderer.createMesh({
				attributes: [
					renderer.createAttribute({
						name: 'position',
						size: 2,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer()
					}),
					renderer.createAttribute({
						name: 'offset',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer()
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type:  RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						buffer: renderer.createAttributeBuffer()
					})
				],
				indexed: true,
				indices: new Uint32Array()
			});
		}

		if (this.attributeBuffersDirty) {
			this.mesh.getAttribute('position').buffer.setData(this.attributeBuffers.position);
			this.mesh.getAttribute('offset').buffer.setData(this.attributeBuffers.offset);
			this.mesh.getAttribute('uv').buffer.setData(this.attributeBuffers.uv);
			this.mesh.setIndices(this.attributeBuffers.index);

			this.attributeBuffersDirty = false;
		}
	}

	private getVisibleLabels(tiles: Tile[], camera: Camera): TileLabelBuffers[] {
		const visibleLabels: TileLabelBuffers[] = [];

		for (const tile of tiles) {
			if (tile.labelBuffersList.length === 0) {
				continue;
			}

			const isInFrustum = camera.isFrustumIntersectsBoundingBox(tile.labelsAABB.toSpace(tile.matrixWorld));

			if (!isInFrustum) {
				continue;
			}

			for (const labelBuffers of tile.labelBuffersList) {
				const x = labelBuffers.x - camera.position.x;
				const y = labelBuffers.y - camera.position.y;
				const z = labelBuffers.z - camera.position.z;
				const position = new Vec3(x, y, z);

				const p = Vec3.applyMatrix4(position, this.matrixWorld);

				if (!camera.frustumContainsPoint(p)) {
					continue;
				}

				labelBuffers.tempPosition = position;
				labelBuffers.distanceToCamera = Vec3.getLength(position);
				visibleLabels.push(labelBuffers);
			}
		}

		return visibleLabels;
	}

	private sortLabelsByPriority(labels: TileLabelBuffers[]): TileLabelBuffers[] {
		return labels.sort((a: TileLabelBuffers, b: TileLabelBuffers) => {
			return b.priority - a.priority;
		});
	}

	private declutterLabels(labels: TileLabelBuffers[], camera: Camera, resolution: Vec2): TileLabelBuffers[] {
		const declutteredLabels: TileLabelBuffers[] = [];

		this.tree.clear();

		for (let i = 0; i < Math.min(labels.length, 300); i++) {
			const label = labels[i];
			const p = Vec3.applyMatrix4(label.tempPosition, this.matrixWorld);
			const projected = Vec3.project(p, camera);
			const x = (projected.x * 0.5 + 0.5) * resolution.x;
			const y = -(projected.y * 0.5 - 0.5) * resolution.y;
			const width = label.width;
			const height = label.height;

			const item = {
				minX: x - width / 2 - DeclutterPaddingX,
				maxX: x + width / 2 + DeclutterPaddingX,
				minY: y - height - DeclutterPaddingY,
				maxY: y + DeclutterPaddingY
			};

			if (!this.tree.collides(item)) {
				declutteredLabels.push(label);
			}

			this.tree.insert(item);
		}

		return declutteredLabels;
	}

	private mergeLabelsIntoBuffers(labels: TileLabelBuffers[], camera: Camera): {
		position: Float32Array;
		offset: Float32Array;
		uv: Float32Array;
		index: Uint32Array;
	} {
		const positionBuffers: Float32Array[] = [];
		const offsetBuffers: Float32Array[] = [];
		const uvBuffers: Float32Array[] = [];
		const indexBuffers: Uint32Array[] = [];
		let vertexIdOffset: number = 0;

		for (let i = 0; i < labels.length; i++) {
			const labelBuffers = labels[i];
			const position = labelBuffers.tempPosition;

			const p = Vec3.applyMatrix4(position, this.matrixWorld);

			if (!camera.frustumContainsPoint(p)) {
				continue;
			}

			const offset = new Float32Array([position.x, position.y, position.z]);
			const offsetBuffer = Utils.fillTypedArraySequence(new Float32Array(labelBuffers.vertexCount * 3), offset);

			positionBuffers.push(labelBuffers.positionBuffer);
			uvBuffers.push(labelBuffers.uvBuffer);
			offsetBuffers.push(offsetBuffer);

			const indexBuffer = new Uint32Array(labelBuffers.indexBuffer);

			for (let i = 0; i < indexBuffer.length; i++) {
				indexBuffer[i] += vertexIdOffset;
			}

			indexBuffers.push(indexBuffer);
			vertexIdOffset += labelBuffers.vertexCount;
		}

		return {
			position: Utils.mergeTypedArrays(Float32Array, positionBuffers),
			offset: Utils.mergeTypedArrays(Float32Array, offsetBuffers),
			uv: Utils.mergeTypedArrays(Float32Array, uvBuffers),
			index: Utils.mergeTypedArrays(Uint32Array, indexBuffers)
		};
	}

	public updateFromTiles(tiles: Tile[], camera: Camera, resolution: Vec2): void {
		const visibleLabels = this.getVisibleLabels(tiles, camera);
		const sortedLabels = this.sortLabelsByPriority(visibleLabels);
		const declutteredLabels = this.declutterLabels(sortedLabels, camera, resolution);
		const buffers = this.mergeLabelsIntoBuffers(declutteredLabels, camera);

		this.position.x = camera.position.x;
		this.position.y = camera.position.y;
		this.position.z = camera.position.z;

		this.updateMatrix();
		this.updateMatrixWorld();

		this.attributeBuffers.position = buffers.position;
		this.attributeBuffers.offset = buffers.offset;
		this.attributeBuffers.uv = buffers.uv;
		this.attributeBuffers.index = buffers.index;

		this.attributeBuffersDirty = true;
	}
}