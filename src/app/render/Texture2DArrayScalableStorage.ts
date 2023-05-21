export interface BinaryTreeNodeAttachment {
	id: string;
}

export class BinaryTreeNode {
	public left: BinaryTreeNode = null;
	public right: BinaryTreeNode = null;
	public parent: BinaryTreeNode = null;
	public leafIndex: number = -1;
	private attachment: BinaryTreeNodeAttachment = null;
	private hasEmptySpace: boolean = true;

	public constructor() {
	}

	private isLeaf(): boolean {
		return this.left === null && this.right === null;
	}

	public findEmptyNode(): BinaryTreeNode {
		if (!this.hasEmptySpace) {
			return null;
		}

		if (this.isLeaf() && this.attachment === null) {
			return this;
		}

		if (this.left) {
			const node = this.left.findEmptyNode();

			if (node !== null) {
				return node;
			}
		}

		if (this.right) {
			const node = this.right.findEmptyNode();

			if (node !== null) {
				return node;
			}
		}

		return null;
	}

	public setAttachment(attachment: BinaryTreeNodeAttachment): void {
		this.attachment = attachment;
		this.hasEmptySpace = attachment === null;

		this.updateEmptyNodeStatus();
	}

	public updateEmptyNodeStatus(): void {
		if (!this.isLeaf()) {
			this.hasEmptySpace = this.left.hasEmptySpace || this.right.hasEmptySpace;
		}

		if (this.parent) {
			this.parent.updateEmptyNodeStatus();
		}
	}
}

export default class Texture2DArrayScalableStorage {
	private treeRoot: BinaryTreeNode;
	private currentLevels: number;
	private attachmentsMap: Map<BinaryTreeNodeAttachment, BinaryTreeNode> = new Map();

	public constructor(private readonly initialLevels: number) {
		this.initTree();
	}

	private initTree(): void {
		this.treeRoot = Texture2DArrayScalableStorage.createBinaryTree(this.initialLevels);
		this.currentLevels = this.initialLevels;
	}

	public expandTree(): void {
		const subtreeOld = this.treeRoot;
		const subtreeNew = Texture2DArrayScalableStorage.createBinaryTree(this.currentLevels, {value: 2 ** this.currentLevels});

		this.treeRoot = new BinaryTreeNode();
		this.treeRoot.left = subtreeOld;
		this.treeRoot.right = subtreeNew;

		++this.currentLevels;
	}

	public addAttachment(attachment: BinaryTreeNodeAttachment): number {
		const node = this.treeRoot.findEmptyNode();

		if (node) {
			node.setAttachment(attachment);
			this.attachmentsMap.set(attachment, node);

			return node.leafIndex;
		}

		this.expandTree();

		return this.addAttachment(attachment);
	}

	public removeAttachment(attachment: BinaryTreeNodeAttachment): void {
		const node = this.attachmentsMap.get(attachment);

		if (node) {
			node.setAttachment(null);
		}
	}

	private static createBinaryTree(levels: number, leftIndexOffset: {value: number} = {value: 0}): BinaryTreeNode {
		const root = new BinaryTreeNode();

		if (levels === 0) {
			root.leafIndex = leftIndexOffset.value++;
			return root;
		}

		root.left = this.createBinaryTree(levels - 1, leftIndexOffset);
		root.right = this.createBinaryTree(levels - 1, leftIndexOffset);

		root.left.parent = root;
		root.right.parent = root;

		return root;
	}
}

// @ts-ignore
window.sus = Texture2DArrayScalableStorage;