import TileTreeImage from "~/app/slippy-map/tree/TileTreeImage";
import CameraViewport from "~/app/slippy-map/CameraViewport";

export default class TileTreeNode {
	public x: number;
	public y: number;
	public zoom: number;
	public children: TileTreeNode[] = [
		null, null, null, null
	];
	public tile: TileTreeImage = null;

	public constructor(x: number, y: number, zoom: number) {
		this.x = x;
		this.y = y;
		this.zoom = zoom;
	}

	public insert(tile: TileTreeImage): void {
		const tileXNorm = tile.x / Math.pow(2, tile.zoom);
		const tileYNorm = tile.y / Math.pow(2, tile.zoom);

		const tileX = Math.floor(tileXNorm * Math.pow(2, this.zoom));
		const tileY = Math.floor(tileYNorm * Math.pow(2, this.zoom));

		if (this.zoom === tile.zoom && this.x === tileX && this.y === tileY) {
			this.tile = tile;
			return;
		}

		this.fetchOrCreateChild(tile.x, tile.y, tile.zoom).insert(tile);
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

		const newChild = new TileTreeNode(childX, childY, childZoom);
		this.children[childIndex] = newChild;

		return newChild;
	}

	private getChildIndex(tileX: number, tileY: number): number {
		const x = tileX % 2;
		const y = tileY % 2;

		return x + y * 2;
	}

	public getLeafs(viewport: CameraViewport, arr: TileTreeImage[] = []): TileTreeImage[] {
		if (!this.intersectsViewport(viewport)) {
			return arr;
		}

		let childSkipped = false;

		for (const child of this.children) {
			if (child === null || !child.intersectsViewport(viewport)) {
				childSkipped = true;
			}

			if (child !== null) {
				child.getLeafs(viewport, arr);
			}
		}

		if (childSkipped && this.tile) {
			arr.push(this.tile);
		}

		return arr;
	}

	public intersectsViewport(viewport: CameraViewport): boolean {
		if (this.zoom > Math.floor(viewport.zoom)) {
			return false;
		}

		const tileSize = 1 / Math.pow(2, this.zoom);

		const minX = this.x * tileSize;
		const minY = this.y * tileSize;

		const maxX = minX + tileSize;
		const maxY = minY + tileSize;

		return (
			minX <= viewport.max.x &&
			maxX >= viewport.min.x &&
			minY <= viewport.max.y &&
			maxY >= viewport.min.y
		);
	}
}