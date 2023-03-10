import MathUtils from "~/lib/math/MathUtils";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";

export function applyMercatorFactorToExtrudedFeatures(extruded: Tile3DExtrudedGeometry[], x: number, y: number, zoom: number): void {
	const scale = MathUtils.getMercatorScaleFactorForTile(x, y, zoom);

	for (const geometry of extruded) {
		geometry.boundingBox.min.y *= scale;
		geometry.boundingBox.max.y *= scale;

		for (let i = 1; i < geometry.positionBuffer.length; i += 3) {
			geometry.positionBuffer[i] *= scale;
		}
	}
}