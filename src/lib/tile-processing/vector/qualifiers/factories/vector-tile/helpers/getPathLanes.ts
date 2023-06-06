import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

export default function getPathLanes(tags: VectorTile.FeatureTags, defaultLanes: number): {
	forward: number;
	backward: number;
} {
	const isOneWay = !!tags.oneway;
	let lanesForward = <number>tags.lanesForward;
	let lanesBackward = <number>tags.lanesBackward;
	const lanesTotal = <number>tags.lanes ?? (
		isOneWay ? Math.max(1, Math.floor(defaultLanes / 2)) : defaultLanes
	);

	if (isOneWay) {
		lanesForward = lanesTotal;
		lanesBackward = 0;
	} else {
		if (lanesForward === undefined && lanesBackward === undefined) {
			lanesForward = Math.ceil(lanesTotal / 2);
			lanesBackward = lanesTotal - lanesForward;
		} else if (lanesForward === undefined) {
			lanesForward = Math.max(0, lanesTotal - lanesBackward);
		} else if (lanesBackward === undefined) {
			lanesBackward = Math.max(0, lanesTotal - lanesForward);
		}
	}

	return {
		forward: lanesForward,
		backward: lanesBackward
	};
}