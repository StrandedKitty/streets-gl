import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {getTagValues} from "~/lib/tile-processing/vector/qualifiers/factories/helpers/tagHelpers";

const lookup: Record<string, {
	type: VectorPolylineDescriptor['pathType'];
	gauge: number;
}> = {
	rail: {type: 'railway', gauge: 1435},
	light_rail: {type: 'railway', gauge: 1435},
	subway: {type: 'railway', gauge: 1435},
	disused: {type: 'railway', gauge: 1435},
	narrow_gauge: {type: 'railway', gauge: 1000},
	tram: {type: 'tramway', gauge: 1435}
}

const gaugeStringValues: Record<string, number> = {
	broad: 1676,
	standard: 1435,
	narrow: 1000
};

function getGaugeWidthFromTags(tags: Record<string, string>, fallback: number): number {
	const gaugeValues = getTagValues(tags, 'gauge');
	let width: number = fallback;

	if (gaugeValues.length > 0) {
		const ints = gaugeValues.map(v => {
			if (gaugeStringValues[v] !== undefined) {
				return gaugeStringValues[v];
			}

			return parseInt(v);
		}).filter(v => !isNaN(v));

		if (ints.length > 0) {
			width = Math.max(...ints);
		}
	}

	return width;
}

export default function getRailwayParamsFromTags(tags: Record<string, string>): {
	type: VectorPolylineDescriptor['pathType'];
	width: number;
} {
	const params = lookup[tags.railway] ?? lookup[tags.rail];
	const gauge = getGaugeWidthFromTags(tags, params.gauge);

	return {
		type: params.type,
		width: gauge / 1000
	};
}