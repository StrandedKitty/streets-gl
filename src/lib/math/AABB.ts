export default abstract class AABB<T> {
	public min: T;
	public max: T;

	public abstract includePoint(point: T): void;

	public abstract includeAABB(aabb: AABB<T>): void;
}