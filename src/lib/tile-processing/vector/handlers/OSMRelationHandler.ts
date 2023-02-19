import {RelationElement, RelationMember} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import OSMWayHandler from "~/lib/tile-processing/vector/handlers/OSMWayHandler";
import Handler from "~/lib/tile-processing/vector/handlers/Handler";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/descriptors";
import {cleanupTags} from "~/lib/tile-processing/vector/tagsUtils";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import {ContainerType, VectorDescriptorFactory} from "~/lib/tile-processing/vector/VectorDescriptorFactory";

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

	private calculateLength(): number {
		let length = 0;

		for (let i = 0; i < this.nodes.length - 1; i++) {
			let point1 = this.nodes[i];
			let point2 = this.nodes[i + 1];
			length += Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
		}

		return length;
	}

	public distributeNodes(interval: number, randomness: number, descriptor: VectorNodeDescriptor): VectorNode[] {
		const length = this.calculateLength();
		const count = Math.floor(length / interval);
		const points: [number, number][] = [];

		if (count > 1) {
			let distance = length / (count - 1);
			let targetNode = 0;
			let availableDistance = 0;
			let edge: [VectorNode, VectorNode] = null;
			let edgeLength = 0;
			let cProgress = 0;
			let nodeProgress = 0;

			points.push([this.nodes[0].x, this.nodes[0].y]);

			for (let i = 0; i < count - 1; i++) {
				while (availableDistance < distance && targetNode < this.nodes.length - 1) {
					edge = [this.nodes[targetNode], this.nodes[targetNode + 1]];
					edgeLength = Math.hypot(edge[1].x - edge[0].x, edge[1].y - edge[0].y);
					availableDistance += edgeLength;
					nodeProgress += edgeLength;

					targetNode++;
				}

				availableDistance -= distance;
				cProgress += distance;

				const vLength = (nodeProgress - cProgress) / edgeLength;

				const vector = {
					x: edge[1].x - edge[0].x,
					y: edge[1].y - edge[0].y
				};
				const point = {
					x: edge[1].x - vector.x * vLength,
					y: edge[1].y - vector.y * vLength
				};

				if (randomness > 0) {
					point.x += (Math.random() - 0.5) * randomness;
					point.y += (Math.random() - 0.5) * randomness;
				}

				/*if(params.skipOutside) {
					if(point.x >= 0 && point.x < this.parent.tileSize && point.z >= 0 && point.z < this.parent.tileSize) {
						points.push(transformedPoint.x, transformedPoint.z);
					}
				} else {
					points.push(transformedPoint.x, transformedPoint.z);
				}*/

				points.push([point.x, point.y]);
			}
		}

		return points.map(([x, y]): VectorNode => {
			return {
				type: 'node',
				x,
				y,
				rotation: 0,
				descriptor,
				osmReference: null
			};
		});
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
		this.tags = cleanupTags(osmElement.tags);
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

			if (feature && feature.type === 'polyline') {
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

	private getFeaturesFromAreaTags(): VectorArea[] {
		const features: VectorArea[] = [];
		const parsed = VectorDescriptorFactory.parseAreaTags(this.tags);

		if (parsed) {
			switch (parsed.type) {
				case ContainerType.Descriptor: {
					features.push({
						type: 'area',
						osmReference: this.getOSMReference(),
						descriptor: parsed.data,
						rings: this.getVectorAreaRings()
					});
					break;
				}
				case ContainerType.Modifier: {
					console.error(`Unexpected modifier ${parsed.data.type}`);
					break;
				}
			}
		}

		return features;
	}

	private getVectorAreaRings(): VectorAreaRing[] {
		return this.getClosedRings().map(ring => ring.getVectorAreaRing());
	}

	public getFeatures(): VectorArea[] {
		if (this.disableFeatureOutput) {
			return [];
		}

		if (!this.cachedFeatures) {
			this.cachedFeatures = [];

			if (this.tags.type === 'multipolygon') {
				this.cachedFeatures.push(...this.getFeaturesFromAreaTags());
			}
		}

		return this.cachedFeatures;
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