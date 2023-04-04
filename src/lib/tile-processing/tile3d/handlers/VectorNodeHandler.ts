import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DInstance, {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import SeededRandom from "~/lib/math/SeededRandom";

const TileSize = 611.4962158203125;

export default class VectorNodeHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorNodeDescriptor;
	private readonly x: number;
	private readonly y: number;
	private mercatorScale: number = 1;
	private terrainHeight: number = 0;

	public constructor(feature: VectorNode) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.x = feature.x;
		this.y = feature.y;
	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
	}

	public getFeatures(): Tile3DInstance[] {
		if (this.isOutOfBounds()) {
			return [];
		}

		if (this.descriptor.type === 'tree') {
			const rnd = new SeededRandom(Math.floor(this.x + this.y));

			return [{
				type: 'instance',
				instanceType: 'tree',
				x: this.x,
				y: this.terrainHeight,
				z: this.y,
				scale: this.descriptor.height * this.mercatorScale,
				rotation: rnd.generate() * Math.PI * 2
			}];
		}

		if (this.descriptor.type === 'adColumn') {
			return [this.getGenericInstanceFeature('adColumn')];
		}

		if (this.descriptor.type === 'transmissionTower') {
			return [this.getGenericInstanceFeature('transmissionTower')];
		}

		if (this.descriptor.type === 'hydrant') {
			return [this.getGenericInstanceFeature('hydrant')];
		}

		return [];
	}

	private getGenericInstanceFeature(type: Tile3DInstanceType): Tile3DInstance {
		return {
			type: 'instance',
			instanceType: type,
			x: this.x,
			y: this.terrainHeight,
			z: this.y,
			scale: this.mercatorScale,
			rotation: 0
		};
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		if (this.isOutOfBounds()) {
			return null;
		}

		if (this.descriptor.type) {
			return {
				positions: new Float64Array([this.x, this.y]),
				callback: (heights: Float64Array): void => {
					this.terrainHeight = heights[0] * this.mercatorScale;
				}
			};
		}

		return null;
	}

	private isOutOfBounds(): boolean {
		return this.x < 0 || this.x > TileSize || this.y < 0 || this.y > TileSize;
	}
}