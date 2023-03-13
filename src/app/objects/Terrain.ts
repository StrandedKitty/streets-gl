import Object3D from "~/lib/core/Object3D";
import TerrainRing from "./TerrainRing";
import Config from "../Config";
import Tile from "~/app/objects/Tile";
import Vec2 from "~/lib/math/Vec2";

export default class Terrain extends Object3D {
	public override children: TerrainRing[];

	public constructor() {
		super();

		for (let i = 0; i < Config.TerrainRingCount; i++) {
			const ring = new TerrainRing(
				Config.TerrainRingSegmentCount,
				i === 0 ? 0 : (Config.TerrainRingSegmentCount / 2),
				Config.TerrainRingSize * (2 ** i)
			);

			this.add(ring);
		}
	}

	public getTileParams(tile: Tile): {
		ring0: TerrainRing;
		ring1: TerrainRing;
		ring0Offset: Vec2;
		ring1Offset: Vec2;
		levelId: number;
	} {
		let ring0: TerrainRing = null;
		let ring1: TerrainRing = null;
		let levelId: number = 0;

		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			const dst = child.size / 2 + Config.TileSize / 2;
			const minX = child.position.x - dst;
			const minZ = child.position.z - dst;
			const maxX = child.position.x + dst;
			const maxZ = child.position.z + dst;
			const tileX = tile.position.x + Config.TileSize / 2;
			const tileZ = tile.position.z + Config.TileSize / 2;

			if (tileX > minX && tileX < maxX && tileZ > minZ && tileZ < maxZ) {
				ring0 = child;
				ring1 = this.children[i + 1] || null;
				levelId = i;
				break;
			}
		}

		const ring0Offset = Vec2.sub(tile.position.xz, ring0.position.xz);
		const ring1Offset = Vec2.sub(tile.position.xz, ring1.position.xz);

		return {ring0, ring1, ring0Offset, ring1Offset, levelId};
	}
}