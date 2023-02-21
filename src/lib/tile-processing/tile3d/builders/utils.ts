export function colorToComponents(color: number): [number, number, number] {
	return [
		color >> 16,
		color >> 8 & 0xff,
		color & 0xff
	];
}