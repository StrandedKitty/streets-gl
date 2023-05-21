type EventMap = Record<string, (...args: any[]) => void>;

export default class EventEmitter<T extends EventMap> {
	private listeners: {
		[K in keyof T]?: T[K][];
	} = {};

	public on<K extends keyof T>(event: K, listener: T[K]): void {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}

		this.listeners[event].push(listener);
	}

	public off<K extends keyof T>(event: K, listener: T[K]): void {
		if (!this.listeners[event]) {
			return;
		}

		const index = this.listeners[event].indexOf(listener);

		if (index !== -1) {
			this.listeners[event].splice(index, 1);
		}
	}

	public emit<K extends keyof T>(event: K, data: Parameters<T[K]> | [] = []): void {
		if (!this.listeners[event]) {
			return;
		}

		for (const listener of this.listeners[event]) {
			listener(data);
		}
	}
}