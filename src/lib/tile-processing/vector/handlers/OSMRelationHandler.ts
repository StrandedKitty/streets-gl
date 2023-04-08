import {RelationElement, RelationMember} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import OSMWayHandler from "~/lib/tile-processing/vector/handlers/OSMWayHandler";
import OSMHandler from "~/lib/tile-processing/vector/handlers/OSMHandler";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {cleanupTags} from "~/lib/tile-processing/vector/utils";
import {ContainerType, VectorDescriptorFactory} from "~/lib/tile-processing/vector/handlers/VectorDescriptorFactory";
import Ring from "~/lib/tile-processing/vector/handlers/Ring";

export default class OSMRelationHandler implements OSMHandler {
	private readonly osmElement: RelationElement;
	private readonly tags: Record<string, string>;
	private readonly members: {
		osmMember: RelationMember;
		handler: OSMWayHandler | OSMRelationHandler;
	}[] = [];
	private disableFeatureOutput: boolean = false;
	private isBuildingPartInRelation: boolean = false;

	private cachedFeatures: VectorArea[] = null;

	public constructor(osmElement: RelationElement) {
		this.osmElement = osmElement;
		this.tags = cleanupTags(osmElement.tags);
	}

	public addMember(member: RelationMember, handler: OSMWayHandler | OSMRelationHandler): void {
		this.members.push({osmMember: member, handler});

		if (this.tags.type === 'building') {
			if (member.role === 'outline') {
				handler.preventFeatureOutput();
			} else if (member.role === 'part') {
				handler.markAsBuildingPartInRelation();
			}
		}
	}

	private getClosedMultipolygonRings(): Ring[] {
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

	public markAsBuildingPartInRelation(): void {
		this.isBuildingPartInRelation = true;
	}

	private getFeaturesFromAreaTags(): VectorArea[] {
		const features: VectorArea[] = [];
		const parsed = VectorDescriptorFactory.parseAreaTags(this.tags);

		if (parsed) {
			const rings = this.getVectorAreaRings();

			if (!rings.some(r => r.type === VectorAreaRingType.Outer)) {
				console.warn(`Relation ${this.osmElement.id} has no outer ring`);
				return [];
			}

			switch (parsed.type) {
				case ContainerType.Descriptor: {
					features.push({
						type: 'area',
						osmReference: this.getOSMReference(),
						descriptor: parsed.data,
						rings: rings,
						isBuildingPartInRelation: this.isBuildingPartInRelation
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
		return this.getClosedMultipolygonRings().map(ring => ring.getVectorAreaRing());
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