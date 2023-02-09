const stringifyRecord = <K extends string, V>(record: Record<K, V>): string => {
	let result = '';

	for (const [k, v] of Object.entries(record)) {
		result += `${k}: ${v}\n`;
	}

	return result;
}

export default stringifyRecord;