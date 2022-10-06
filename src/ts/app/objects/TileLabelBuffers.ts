import FontJSON from "../../../resources/Inter-Regular.json";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as createLayout from 'layout-bmfont-text';
import {getIndices, getUvs, getPositions} from '../world/geometry/FontGeometryGenerator';
import Vec3 from "~/math/Vec3";

const LabelWidth = 200;
const SDFTextureWidth = 256;
const SDFTextureHeight = 256;

export default class TileLabelBuffers {
	public positionBuffer: Float32Array;
	public uvBuffer: Float32Array;
	public indexBuffer: Uint32Array;
	public priority: number;
	public x: number;
	public y: number;
	public z: number;
	public vertexCount: number;
	public tempPosition: Vec3;
	public distanceToCamera: number;
	public text: string;
	public width: number;
	public height: number;

	public constructor(
		{
			text,
			priority,
			x,
			y,
			z
		}: {
			text: string;
			priority: number;
			x: number;
			y: number;
			z: number;
		}
	) {
		this.priority = priority;
		this.x = x;
		this.y = y;
		this.z = z;
		this.text = text;

		this.updateBuffers();
	}

	public updateBuffers(): void {
		const layout = createLayout({
			font: FontJSON,
			text: this.text,
			width: LabelWidth,
			letterSpacing: 1,
			align: 'center'
		});

		const positions = getPositions(layout.glyphs);
		this.vertexCount = positions.length / 2;
		this.uvBuffer = getUvs(layout.glyphs, SDFTextureWidth, SDFTextureHeight, false);
		this.indexBuffer = new Uint32Array(getIndices([], {
			clockwise: true,
			type: 'uint32',
			count: layout.glyphs.length,
		}));

		this.positionBuffer = new Float32Array(this.vertexCount * 3);

		for (let i = 0, j = 0; i < this.positionBuffer.length; i += 3, j += 2) {
			this.positionBuffer[i] = positions[j] - LabelWidth / 2;
			this.positionBuffer[i + 1] = -positions[j + 1] + 16;
			this.positionBuffer[i + 2] = 0;
		}

		this.width = layout.width;
		this.height = layout.height;
	}
}