import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default class TerrainRing extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	public segmentCount: number;
	public holeSegmentCount: number;
	public size: number;
	public maskTextureTransform: Float32Array = new Float32Array(3);
	public waterTextureTransform0: Float32Array = new Float32Array(4);
	public waterTextureTransform1: Float32Array = new Float32Array(4);
	public heightTextureTransform0: Float32Array = new Float32Array(4);
	public heightTextureTransform1: Float32Array = new Float32Array(4);
	public morphOffset: Float32Array = new Float32Array(2);
	public isLastRing: boolean = false;

	public constructor(segmentCount: number, holeSegmentCount: number, size: number) {
		super();

		this.segmentCount = segmentCount;
		this.holeSegmentCount = holeSegmentCount;
		this.size = size;
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.mesh) {
			const buffers = this.getBuffers();

			console.log(buffers.position.length / 3)

			this.mesh = renderer.createMesh({
				attributes: [
					renderer.createAttribute({
						name: 'position',
						size: 3,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: buffers.position
					}),
					renderer.createAttribute({
						name: 'uv',
						size: 2,
						type: RendererTypes.AttributeType.Float32,
						format: RendererTypes.AttributeFormat.Float,
						normalized: false,
						data: buffers.uv
					})
				]
			});
		}
	}

	private getBuffers(): {position: Float32Array; uv: Float32Array} {
		const start = Math.floor((this.segmentCount - this.holeSegmentCount) / 2);
		const end = this.segmentCount - start;

		const buffers = TerrainRing.createSquareGridGeometryWithHoleNonIndexed(
			this.size,
			this.segmentCount,
			this.holeSegmentCount > 0,
			start + 0.5,
			end - 0.5
		);

		return {
			position: buffers.positions,
			uv: buffers.uvs
		};
	}

	private static createSquareGridGeometryWithHoleNonIndexed(
		gridSize: number,
		segmentCount: number,
		hole: boolean,
		holeFromSegment: number = 0,
		holeToSegment: number = 0
	): {positions: Float32Array; uvs: Float32Array} {
		const totalSegmentCount: number = segmentCount * segmentCount - (holeToSegment - holeFromSegment) ** 2 + 1;
		const positions: Float32Array = new Float32Array(totalSegmentCount * 24 * 3);
		const uvs: Float32Array = new Float32Array(totalSegmentCount * 24 * 2);
		const step: number = gridSize / segmentCount * 0.5;
		const uvStep: number = 0.5 / segmentCount;

		let i = 0;
		let j = 0;
		for (let y = 0; y < segmentCount * 2; y++) {
			for (let x = 0; x < segmentCount * 2; x++) {
				const sx = (x / 2);
				const sy = (y / 2);

				if (hole && sx >= holeFromSegment && sx <= holeToSegment && sy >= holeFromSegment && sy <= holeToSegment) {
					continue;
				}

				if ((x + y) % 2 === 0) {
					positions[i] = x * step;
					positions[i + 1] = 0;
					positions[i + 2] = y * step;

					positions[i + 3] = (x + 1) * step;
					positions[i + 4] = 0;
					positions[i + 5] = y * step;

					positions[i + 6] = (x + 1) * step;
					positions[i + 7] = 0;
					positions[i + 8] = (y + 1) * step;

					positions[i + 9] = x * step;
					positions[i + 10] = 0;
					positions[i + 11] = y * step;

					positions[i + 12] = (x + 1) * step;
					positions[i + 13] = 0;
					positions[i + 14] = (y + 1) * step;

					positions[i + 15] = x * step;
					positions[i + 16] = 0;
					positions[i + 17] = (y + 1) * step;

					uvs[j] = x * uvStep;
					uvs[j + 1] = y * uvStep;

					uvs[j + 2] = (x + 1) * uvStep;
					uvs[j + 3] = y * uvStep;

					uvs[j + 4] = (x + 1) * uvStep;
					uvs[j + 5] = (y + 1) * uvStep;

					uvs[j + 6] = x * uvStep;
					uvs[j + 7] = y * uvStep;

					uvs[j + 8] = (x + 1) * uvStep;
					uvs[j + 9] = (y + 1) * uvStep;

					uvs[j + 10] = x * uvStep;
					uvs[j + 11] = (y + 1) * uvStep;
				} else {
					positions[i] = x * step;
					positions[i + 1] = 0;
					positions[i + 2] = y * step;

					positions[i + 3] = (x + 1) * step;
					positions[i + 4] = 0;
					positions[i + 5] = y * step;

					positions[i + 6] = x * step;
					positions[i + 7] = 0;
					positions[i + 8] = (y + 1) * step;

					positions[i + 9] = (x + 1) * step;
					positions[i + 10] = 0;
					positions[i + 11] = y * step;

					positions[i + 12] = (x + 1) * step;
					positions[i + 13] = 0;
					positions[i + 14] = (y + 1) * step;

					positions[i + 15] = x * step;
					positions[i + 16] = 0;
					positions[i + 17] = (y + 1) * step;

					uvs[j] = x * uvStep;
					uvs[j + 1] = y * uvStep;

					uvs[j + 2] = (x + 1) * uvStep;
					uvs[j + 3] = y * uvStep;

					uvs[j + 4] = x * uvStep;
					uvs[j + 5] = (y + 1) * uvStep;

					uvs[j + 6] = (x + 1) * uvStep;
					uvs[j + 7] = y * uvStep;

					uvs[j + 8] = (x + 1) * uvStep;
					uvs[j + 9] = (y + 1) * uvStep;

					uvs[j + 10] = x * uvStep;
					uvs[j + 11] = (y + 1) * uvStep;
				}

				i += 18;
				j += 12;
			}
		}

		for (let i = 0; i < positions.length; i += 3) {
			positions[i] -= gridSize / 2;
			positions[i + 2] = gridSize - positions[i + 2] - gridSize / 2;
		}

		return {
			positions,
			uvs
		};
	}
}