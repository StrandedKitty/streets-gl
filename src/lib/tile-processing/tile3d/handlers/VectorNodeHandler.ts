import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";

const TileSize = 611.4962158203125;

export default class VectorNodeHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorNodeDescriptor;
	private readonly x: number;
	private readonly y: number;
	private terrainHeight: number = 0;

	public constructor(feature: VectorNode) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.x = feature.x;
		this.y = feature.y;
	}

	public getFeatures(): Tile3DFeature[] {
		if (this.isOutOfBounds()) {
			return [];
		}

		if (this.descriptor.type === 'tree') {
			return [<Tile3DInstance>{
				type: 'instance',
				instanceType: 'tree',
				x: this.x,
				y: this.terrainHeight,
				z: this.y,
				scale: this.descriptor.height,
				rotation: 0
			}];
		}

		if (this.descriptor.type === 'adColumn') {
			return [<Tile3DInstance>{
				type: 'instance',
				instanceType: 'adColumn',
				x: this.x,
				y: this.terrainHeight,
				z: this.y,
				scale: 1,
				rotation: 0
			}];
		}

		if (this.descriptor.type === 'transmissionTower') {
			return [<Tile3DInstance>{
				type: 'instance',
				instanceType: 'transmissionTower',
				x: this.x,
				y: this.terrainHeight,
				z: this.y,
				scale: 1,
				rotation: 0
			}];
		}

		if (this.descriptor.type === 'hydrant') {
			return [<Tile3DInstance>{
				type: 'instance',
				instanceType: 'hydrant',
				x: this.x,
				y: this.terrainHeight,
				z: this.y,
				scale: 1,
				rotation: 0
			}];
		}

		return [];
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		if (this.isOutOfBounds()) {
			return null;
		}

		if (this.descriptor.type) {
			return {
				positions: new Float64Array([this.x, this.y]),
				callback: (heights: Float64Array): void => {
					this.terrainHeight = heights[0];
				}
			};
		}

		return null;
	}

	private isOutOfBounds(): boolean {
		return this.x < 0 || this.x > TileSize || this.y < 0 || this.y > TileSize;
	}
}