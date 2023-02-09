const latLonRegex = /^((\-?|\+?)?\d+(\.\d+)?)(,| )\s*((\-?|\+?)?\d+(\.\d+)?)$/;

export default function parseLatLon(text: string): [number, number] | null {
	const latLonMatch = text.match(latLonRegex);

	if (!latLonMatch) {
		return null;
	}

	const lat = parseFloat(latLonMatch[1]);
	const lon = parseFloat(latLonMatch[5]);

	if (lat < -85.051129 || lat > 85.051129 || lon < -180 || lon > 180) {
		return null;
	}

	return [lat, lon];
}