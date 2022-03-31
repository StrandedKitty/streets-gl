export class Queue<T> {
	private store: T[] = [];

	public get size(): number {
		return this.store.length;
	}

	public push(val: T) {
		this.store.push(val);
	}

	public pop(): T | undefined {
		return this.store.shift();
	}

	public isEmpty(): boolean {
		return this.store.length === 0;
	}
}