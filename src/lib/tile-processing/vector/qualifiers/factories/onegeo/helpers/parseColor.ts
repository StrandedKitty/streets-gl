export default function parseColor(color: string): number {
	if (!color) {
		return undefined;
	}

	if (color.startsWith('#')) {
		color = color.slice(1);
	}

	if (color.length === 3) {
		color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
	}

	if (color.length !== 6) {
		return undefined;
	}

	return parseInt(color, 16);
}
