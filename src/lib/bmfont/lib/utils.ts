export function mapRange(value: number, a: number, b: number, c: number = 0, d: number = 1): number {
	const _v = (value - a) / (b - a);
	return c + _v * (d - c);
}
