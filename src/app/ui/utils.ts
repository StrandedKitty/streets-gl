export function debounce<T extends (...args: any) => void>(cb: T, wait = 1000): T {
	let h: NodeJS.Timeout;
	const callable = (...args: any): void => {
		clearTimeout(h);
		h = setTimeout(() => cb(...args), wait) as any as NodeJS.Timeout;
	};
	return callable as any as T;
}