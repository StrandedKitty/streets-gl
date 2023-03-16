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

export function getRoadUV(lanesForward: number, lanesBackward: number): {minX: number; maxX: number} {
	const texLanes = 8;
	const laneMarkWidth = 1 / texLanes * 0.05;
	const laneWidth = 1 / texLanes;

	lanesForward = Math.min(texLanes, lanesForward);
	lanesBackward = Math.min(texLanes, lanesBackward);

	const minLane = -lanesForward;
	const maxLane = lanesBackward;

	const min = minLane * laneWidth + 0.5;
	const max = maxLane * laneWidth + 0.5;

	return {
		minX: min + laneMarkWidth,
		maxX: max - laneMarkWidth
	};
}