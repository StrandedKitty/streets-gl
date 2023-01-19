import UniversalFeature, {OSMReference} from "./UniversalFeature";
import {UniversalAreaDescription} from "./descriptions";
import UniversalNode from "./UniversalNode";
import Node3D from "../geometry/features/3d/Node3D";

export enum UniversalAreaRingType {
	Inner,
	Outer
}

const removeLastEl = (arr: UniversalNode[]): UniversalNode[] => {
	return arr.slice(0, arr.length - 1);
};

export class UniversalAreaRing {
	public nodes: UniversalNode[];
	public type: UniversalAreaRingType;

	public constructor(nodes: UniversalNode[], type: UniversalAreaRingType) {
		this.nodes = nodes;
		this.type = type;
	}

	public tryMerge(ring: UniversalAreaRing): boolean {
		if (this.type !== ring.type) {
			return false;
		}

		if (this.firstNode === ring.firstNode) {
			this.nodes = [...removeLastEl(this.nodes.reverse()), ...ring.nodes];
			return true;
		} else if (this.lastNode === ring.firstNode) {
			this.nodes = [...removeLastEl(this.nodes), ...ring.nodes];
			return true;
		} else if (this.firstNode === ring.lastNode) {
			this.nodes = [...ring.nodes, ...this.nodes.slice(1)];
			return true;
		} else if (this.lastNode === ring.lastNode) {
			this.nodes = [...ring.nodes, ...this.nodes.reverse().slice(1)];
			return true;
		}

		return false;
	}

	public get firstNode(): UniversalNode {
		return this.nodes[0];
	}

	public get lastNode(): UniversalNode {
		return this.nodes[this.nodes.length - 1];
	}
}

export default class UniversalArea extends UniversalFeature {
	public description: UniversalAreaDescription;
	public rings: UniversalAreaRing[];

	public constructor(
		rings: UniversalAreaRing[],
		description: UniversalAreaDescription,
		osmReference: OSMReference
	) {
		super(osmReference);

		this.description = description;
		this.rings = rings;

		this.resolvePartialRings();
	}

	private resolvePartialRings(): void {
		const ringSet = new Set(this.rings);

		// not sure if this is the best way to approach the problem of merging partial rings
		for (const ring of ringSet) {
			for (const anotherRing of ringSet) {
				if (anotherRing === ring) {
					continue;
				}

				if (ring.tryMerge(anotherRing)) {
					ringSet.delete(anotherRing);
				}
			}
		}

		for (const ring of ringSet) {
			if (ring.firstNode !== ring.lastNode) {
				ringSet.delete(ring);
			}
		}

		this.rings = Array.from(ringSet);
	}
}