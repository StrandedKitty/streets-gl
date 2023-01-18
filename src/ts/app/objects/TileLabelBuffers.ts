import FontJSON from "../../../resources/Inter-Regular.json";
import Vec3 from "~/math/Vec3";
import {LayoutGenerator} from "~/bmfont";

const FontSize = 12;
const LineHeight = 1.25;
const LabelWidth = 200;

const textGenerator = new LayoutGenerator(FontJSON as any);

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
		const layout2 = textGenerator.layout({
			text: this.text,
			width: LabelWidth / FontSize,
			letterSpacing: 0.1,
			align: 'center',
			lineHeight: LineHeight
		});

		this.positionBuffer = new Float32Array(layout2.verts);
		this.uvBuffer = new Float32Array(layout2.uvs);
		this.indexBuffer = new Uint32Array(layout2.indices);

		for (let i = 0; i < this.positionBuffer.length; i += 2) {
			this.positionBuffer[i] *= 12;
			this.positionBuffer[i + 1] *= 12;

			this.positionBuffer[i] = this.positionBuffer[i] - LabelWidth / 2;
			this.positionBuffer[i + 1] += (layout2.lineCount - 0.5) * FontSize * 1.25;
		}

		this.vertexCount = this.positionBuffer.length / 2;

		this.width = LabelWidth;
		this.height = layout2.lineCount * LineHeight * FontSize;
	}
}