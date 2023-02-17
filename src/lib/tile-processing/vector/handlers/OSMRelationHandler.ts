import {RelationElement, RelationMember} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import OSMWayHandler from "~/lib/tile-processing/vector/handlers/OSMWayHandler";
import Handler from "~/lib/tile-processing/vector/handlers/Handler";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";

const removeFirstEl = (arr: VectorNode[]): VectorNode[] => {
	return arr.slice(1);
};

const removeLastEl = (arr: VectorNode[]): VectorNode[] => {
	return arr.slice(0, arr.length - 1);
};

export class Ring {
	public type: VectorAreaRingType;
	public nodes: VectorNode[];

	public constructor(nodes: VectorNode[], type: VectorAreaRingType) {
		this.nodes = nodes;
		this.type = type;
	}

	public get firstNode(): VectorNode {
		return this.nodes[0];
	}

	public get lastNode(): VectorNode {
		return this.nodes[this.nodes.length - 1];
	}

	public tryMerge(ring: Ring): boolean {
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
			this.nodes = [...ring.nodes, ...removeFirstEl(this.nodes)];
			return true;
		} else if (this.lastNode === ring.lastNode) {
			this.nodes = [...ring.nodes, ...removeFirstEl(this.nodes.reverse())];
			return true;
		}

		return false;
	}

	private getGaussArea(): number {
		const vertices = this.nodes;
		let sum = 0;

		for (let i = 0; i < vertices.length; i++) {
			const point1 = vertices[i];
			const point2 = vertices[i + 1] ?? vertices[0];
			sum += (point2.x - point1.x) * (point2.y + point1.y);
		}

		return sum;
	}

	public fixDirection(): void {
		const area = this.getGaussArea();
		const shouldReverse = (area > 0 && this.type === VectorAreaRingType.Inner) ||
			(area < 0 && this.type === VectorAreaRingType.Outer);

		if (shouldReverse) {
			this.nodes.reverse();
		}
	}

	public getVectorAreaRing(): VectorAreaRing {
		return {
			type: this.type,
			nodes: this.nodes
		};
	}
}

export default class OSMRelationHandler implements Handler {
	private readonly osmElement: RelationElement;
	private readonly tags: Record<string, string>;
	private readonly members: {
		osmMember: RelationMember;
		handler: OSMWayHandler | OSMRelationHandler
	}[] = [];
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: VectorArea[] = null;

	public constructor(osmElement: RelationElement) {
		this.osmElement = osmElement;
		this.tags = osmElement.tags ?? {};
	}

	public addMember(member: RelationMember, handler: OSMWayHandler | OSMRelationHandler): void {
		this.members.push({osmMember: member, handler});

		if (this.tags.type === 'building' && member.role === 'outline') {
			handler.preventFeatureOutput();
		}
	}

	private getClosedRings(): Ring[] {
		const rings: Ring[] = [];

		for (const {handler, osmMember} of this.members) {
			const feature = handler.getStructuralFeature();

			if (feature.type === 'polyline') {
				const type = OSMRelationHandler.getRingTypeFromRole(osmMember.role);

				if (type === null) {
					continue;
				}

				rings.push(new Ring(
					feature.nodes,
					type
				));
			}
		}

		const closedRings = OSMRelationHandler.resolvePartialRings(rings);

		for (const ring of closedRings) {
			ring.fixDirection();
		}

		return closedRings;
	}

	public preventFeatureOutput(): void {
		this.disableFeatureOutput = true;
	}

	private getVectorAreaRings(): VectorAreaRing[] {
		return this.getClosedRings().map(ring => ring.getVectorAreaRing());
	}

	public getFeatures(): VectorArea[] {
		if (this.disableFeatureOutput) {
			return [];
		}

		if (!this.cachedFeatures) {
			if (this.tags.type === 'multipolygon') {
				this.cachedFeatures = [{
					type: 'area',
					descriptor: null,
					osmReference: this.getOSMReference(),
					rings: this.getVectorAreaRings()
				}];
			}
		}

		return this.cachedFeatures ?? [];
	}

	public getStructuralFeature(): VectorArea {
		return null;
	}

	private getOSMReference(): OSMReference {
		return {
			type: OSMReferenceType.Relation,
			id: this.osmElement.id
		};
	}

	private static resolvePartialRings(rings: Ring[]): Ring[] {
		const partials: Ring[] = [];
		const closed: Ring[] = [];

		for (const ring of rings) {
			if (ring.firstNode === ring.lastNode) {
				closed.push(ring);
			} else {
				partials.push(ring);
			}
		}

		const list = new Set(partials);

		for (const ring of list) {
			for (const anotherRing of list) {
				if (anotherRing === ring) {
					continue;
				}

				if (ring.tryMerge(anotherRing)) {
					list.delete(anotherRing);
				}
			}
		}

		const processedPartials = Array.from(list).filter(ring => ring.firstNode === ring.lastNode);

		return [...closed, ...processedPartials];
	}

	private static getRingTypeFromRole(role: string): VectorAreaRingType {
		if (role === 'inner') {
			return VectorAreaRingType.Inner;
		}

		if (role === 'outer') {
			return VectorAreaRingType.Outer;
		}

		return null;
	}
}