import {Queue} from "../Utils";

describe('Queue', () => {
	test(`should be empty after initialization`, () => {
		const queue = new Queue();
		expect(queue.isEmpty()).toBe(true);
	});

	test(`should be not empty after pushing an element`, () => {
		const queue = new Queue<number>();

		queue.push(0);
		expect(queue.isEmpty()).toBe(false);
	});

	test.each([...new Array(5)].map((_, i) => i))(
		`should report correct size after pushing %d element(s)`,
		(value) => {
			const queue = new Queue<number>();

			for (let i = 0; i < value; i++) {
				queue.push(i);
			}

			expect(queue.size).toBe(value);
		}
	);

	test(`should provide items in correct order`, () => {
		const queue = new Queue<number>();
		const expected = [...new Array(10)].map((_, i) => i);

		for (const item of expected) {
			queue.push(item);
		}

		const result: number[] = [];

		while (queue.size > 0) {
			result.push(queue.pop());
		}

		expect(result).toEqual(expected);
	});
});