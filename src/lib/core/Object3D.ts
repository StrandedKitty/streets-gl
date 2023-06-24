import Mat4 from "../math/Mat4";
import Vec3 from "../math/Vec3";

export default class Object3D {
	private static EmptyPosition: Vec3 = new Vec3(0, 0, 0);
	private static EmptyScale: Vec3 = new Vec3(1, 1, 1);
	private static IDCounter: number = 0;

	public id: number = Object3D.IDCounter++;
	public children: Object3D[] = [];
	public parent: Object3D = null;
	public matrix: Mat4 = Mat4.identity();
	public matrixWorld: Mat4 = Mat4.identity();
	public matrixOverwrite: boolean = true;

	public position: Vec3 = new Vec3();
	public rotation: Vec3 = new Vec3();
	public scale: Vec3 = new Vec3(1, 1, 1);

	public constructor() {
	}

	public updateMatrix(): Mat4 {
		this.matrix = Mat4.identity();

		if (!this.position.equals(Object3D.EmptyPosition)) {
			this.matrix = Mat4.translate(this.matrix, this.position.x, this.position.y, this.position.z);
		}

		if (!this.scale.equals(Object3D.EmptyScale)) {
			this.matrix = Mat4.scale(this.matrix, this.scale.x, this.scale.y, this.scale.z);
		}

		if (this.rotation.x !== 0) {
			this.matrix = Mat4.xRotate(this.matrix, this.rotation.x);
		}

		if (this.rotation.y !== 0) {
			this.matrix = Mat4.yRotate(this.matrix, this.rotation.y);
		}

		if (this.rotation.z !== 0) {
			this.matrix = Mat4.zRotate(this.matrix, this.rotation.z);
		}


		return this.matrix;
	}

	public updateMatrixWorld(): Mat4 {
		if (this.parent) {
			this.matrixWorld = Mat4.multiply(this.parent.updateMatrixWorld(), this.matrix);
		} else {
			this.matrixWorld = Mat4.copy(this.matrix);
		}

		return this.matrixWorld;
	}

	public updateMatrixWorldRecursively(): void {
		if (this.parent) {
			this.matrixWorld = Mat4.multiply(this.parent.matrixWorld, this.matrix);
		} else {
			this.matrixWorld = Mat4.copy(this.matrix);
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].updateMatrixWorldRecursively();
		}
	}

	public updateMatrixRecursively(): void {
		if (this.matrixOverwrite) {
			this.updateMatrix();
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].updateMatrixRecursively();
		}
	}

	public add(...objects: Object3D[]): void {
		for (const object of objects) {
			if (this.children.includes(object)) {
				return;
			}

			this.children.push(object);
			object.parent = this;
			object.updateMatrixWorld();
		}
	}

	public remove(...objects: Object3D[]): void {
		for (let i = 0; i < this.children.length; i++) {
			if (objects.includes(this.children[i])) {
				this.children[i].parent = null;
				this.children.splice(i, 1);
			}
		}
	}

	public lookAt(target: Vec3, isWorldPosition = false): void {
		const targetPosition = isWorldPosition ? Vec3.applyMatrix4(target, this.updateMatrixWorld()) : target;
		this.matrix = Mat4.lookAt(this.position, targetPosition, new Vec3(0, 1, 0));
	}
}
