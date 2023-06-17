import { parseMeters } from "./tagHelpers";

export default function getTreeHeight(tags: Record<string, string>): number | undefined {
	const minHeight = parseMeters(tags['min_height']) || 0.0;
	let height = (parseMeters(tags['height']) || parseMeters(tags['est_height'])) - minHeight;

	if (!height) {
		// estimate height from width
		let width = parseMeters(tags['diameter_crown']);

		// estimate width from trunk diameter / circumference
		if (!width) {
			const diameter = parseMeters(tags['diameter']) || parseMeters(tags['circumference']) / Math.PI;
			width = diameter * 30.0;
		}
		
		height = width * 2.0;
	}

	return height || undefined;
}