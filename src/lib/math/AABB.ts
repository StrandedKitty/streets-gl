export default abstract class AABB<T> {
	public isEmpty: boolean = true;
	public min: T;
	public max: T;

	public abstract includePoint(point: T): void;

	public abstract includeAABB(aabb: AABB<T>): void;

	public abstract includesPoint(point: T): boolean;

	public abstract intersectsAABB(aabb: AABB<T>): boolean;

	public abstract clone(): AABB<T>;
}