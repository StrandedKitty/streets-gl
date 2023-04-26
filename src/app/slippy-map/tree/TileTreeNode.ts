import TileTreeImage from "~/app/slippy-map/tree/TileTreeImage";
import CameraViewport from "~/app/slippy-map/CameraViewport";

export default class TileTreeNode {
	public x: number;
	public y: number;
	public zoom: number;
	private parent: TileTreeNode;
	private children: TileTreeNode[] = [
		null, null, null, null
	];
	private tile: TileTreeImage = null;

	public constructor(x: number, y: number, zoom: number, parent: TileTreeNode = null) {
		this.x = x;
		this.y = y;
		this.zoom = zoom;
		this.parent = parent;
	}

	public insert(tile: TileTreeImage): void {
		const tileXNorm = tile.x / Math.pow(2, tile.zoom);
		const tileYNorm = tile.y / Math.pow(2, tile.zoom);

		const tileX = Math.floor(tileXNorm * Math.pow(2, this.zoom));
		const tileY = Math.floor(tileYNorm * Math.pow(2, this.zoom));

		if (this.zoom === tile.zoom && this.x === tileX && this.y === tileY) {
			tile.parent = this;
			this.tile = tile;
			return;
		}

		this.fetchOrCreateChild(tile.x, tile.y, tile.zoom).insert(tile);
	}

	public onTileRemoved(): void {
		this.tile = null;
		this.tryRemoveSelf();
	}

	private tryRemoveSelf(): void {
		if (!this.tile && this.children.every((child) => child === null)) {
			this.parent.removeChild(this);
		}
	}

	public removeChild(child: TileTreeNode): void {
		const childIndex = this.children.indexOf(child);

		if (childIndex !== -1) {
			this.children[childIndex] = null;
		}

		this.tryRemoveSelf();
	}

	private fetchOrCreateChild(x: number, y: number, zoom: number): TileTreeNode {
		const tileXNorm = x / Math.pow(2, zoom);
		const tileYNorm = y / Math.pow(2, zoom);

		const childZoom = this.zoom + 1;
		const childX = Math.floor(tileXNorm * Math.pow(2, childZoom));
		const childY = Math.floor(tileYNorm * Math.pow(2, childZoom));

		const childIndex = this.getChildIndex(childX, childY);
		const child = this.children[childIndex];

		if (child) {
			return child;
		}

		const newChild = new TileTreeNode(childX, childY, childZoom, this);
		this.children[childIndex] = newChild;

		return newChild;
	}

	private getChildIndex(tileX: number, tileY: number): number {
		const x = tileX % 2;
		const y = tileY % 2;

		return x + y * 2;
	}
}