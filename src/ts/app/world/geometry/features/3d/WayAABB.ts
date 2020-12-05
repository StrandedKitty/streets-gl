export default class WayAABB {
	private minX: number;
	private minY: number;
	private maxX: number;
	private maxY: number;
	private empty: boolean = true;

	public set(minX: number, minY: number, maxX: number, maxY: number) {
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;

		if(this.empty) {
			this.empty = false;
		}
	}

	public addPoint(x: number, y: number) {
		if(this.empty) {
			this.minX = x;
			this.minY = y;

			this.maxX = x;
			this.maxY = y;

			this.empty = false;
		} else {
			this.minX = Math.min(this.minX, x);
			this.minY = Math.min(this.minY, y);

			this.maxX = Math.max(this.maxX, x);
			this.maxY = Math.max(this.maxY, y);
		}
	}

	public intersectsAABB(box: WayAABB): boolean {
		if (box.empty || this.empty) {
			return false;
		}

		return !(
			box.maxX <= this.minX ||
			box.minX >= this.maxX ||
			box.maxY <= this.minY ||
			box.minY >= this.maxX
		);
	}

	public getArea(): number {
		return (this.maxX - this.minX) * (this.maxY - this.minY);
	}
}