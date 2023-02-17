export interface FeatureProvider<T> {
	getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number;
		}
	): Promise<T>;
}