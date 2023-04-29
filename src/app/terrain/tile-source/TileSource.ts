export default abstract class TileSource<T> {
	public data: T = null;
	protected deleted: boolean = false;
	public lastUsedTimestamp: number = Date.now();
	public isCurrentlyUsed: boolean = false;

	protected constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly zoom: number
	) {}

	public abstract load(): Promise<void>;

	public markUnused(): void {
		this.isCurrentlyUsed = false;
	}

	public markUsed(): void {
		this.isCurrentlyUsed = true;
	}

	public abstract delete(): void;
}