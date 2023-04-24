import TileTreeImage from "~/app/slippy-map/tree/TileTreeImage";
import TileTreeNode from "~/app/slippy-map/tree/TileTreeNode";
import CameraViewport from "~/app/slippy-map/CameraViewport";

export default class TileTree {
	private root: TileTreeNode;

	public constructor() {
		this.root = new TileTreeNode(0, 0, 0);
	}

	public insert(tile: TileTreeImage): void {
		return this.root.insert(tile);
	}

	public getLeafs(viewport: CameraViewport): TileTreeImage[] {
		return this.root.getLeafs(viewport);
	}
}