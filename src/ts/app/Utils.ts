export default class Utils {
	public static hexToRgb(hex: string): number[] {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	}

	public static fillTypedArraySequence<T extends TypedArray>(type: { new(l: number): T }, typedArray: T, sequence: T): T {
		const length = typedArray.length;
		let sequenceLength = sequence.length;
		let position = sequenceLength;

		typedArray.set(sequence);

		while (position < length) {
			if (position + sequenceLength > length) {
				sequenceLength = length - position;
			}

			typedArray.copyWithin(position, 0, sequenceLength);
			position += sequenceLength;
			sequenceLength <<= 1;
		}

		return typedArray;
	}
}