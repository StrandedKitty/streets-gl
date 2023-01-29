import Object3D from "~/lib/core/Object3D";
import TerrainRing from "./TerrainRing";
import Config from "../Config";

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
}