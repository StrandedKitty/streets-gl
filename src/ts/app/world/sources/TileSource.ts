export default abstract class TileSource {
	protected constructor() {

	}

	public abstract getURL(x: number, y: number): string;
}
