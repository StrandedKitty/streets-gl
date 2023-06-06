const MAX_BLOCK_SIZE = 20000;

// https://github.com/stardazed/stardazed/blob/master/src/core/buffer.ts
export function appendArrayInPlace<T>(dest: T[], source: T[]): T[] {
	let offset: number = 0;
	let itemsLeft: number = source.length;

	if (itemsLeft <= MAX_BLOCK_SIZE) {
		dest.push.apply(dest, source);
	} else {
		while (itemsLeft > 0) {
			const pushCount = Math.min(MAX_BLOCK_SIZE, itemsLeft);
			const subSource = source.slice(offset, offset + pushCount);
			dest.push.apply(dest, subSource);
			itemsLeft -= pushCount;
			offset += pushCount;
		}
	}

	return dest;
}