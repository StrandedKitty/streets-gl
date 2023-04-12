import OSMNodeHandler from "~/lib/tile-processing/vector/handlers/OSMNodeHandler";
import {WayElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import {VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import OSMHandler from "~/lib/tile-processing/vector/handlers/OSMHandler";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {cleanupTags} from "~/lib/tile-processing/vector/utils";
import Ring from "~/lib/tile-processing/vector/handlers/Ring";
import PolylineQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/PolylineQualifierFactory";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import AreaQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/AreaQualifierFactory";

export default class OSMWayHandler implements OSMHandler {
	private readonly osmElement: WayElement;
	private readonly tags: Record<string, string>;
	private readonly nodes: OSMNodeHandler[];
	private disableFeatureOutput: boolean = false;
	private isBuildingPartInRelation: boolean = false;

	private cachedFeatures: VectorFeature[] = null;
	private cachedStructuralFeature: VectorPolyline = null;

	public constructor(osmElement: WayElement, nodes: OSMNodeHandler[]) {
		this.osmElement = osmElement;
		this.tags = cleanupTags(osmElement.tags);
		this.nodes = nodes;
	}

	private isClosed(): boolean {
		return this.nodes[0] === this.nodes[this.nodes.length - 1];
	}

	public preventFeatureOutput(): void {
		this.disableFeatureOutput = true;
	}

	public markAsBuildingPartInRelation(): void {
		this.isBuildingPartInRelation = true;
	}

	private getFeaturesFromPolylineTags(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new PolylineQualifierFactory().fromTags(this.tags);

		if (!qualifiers) {
			return features;
		}

		for (const qualifier of qualifiers) {
			switch (qualifier.type) {
				case QualifierType.Descriptor: {
					features.push({
						type: 'polyline',
						osmReference: this.getOSMReference(),
						descriptor: qualifier.data as VectorPolylineDescriptor,
						nodes: this.nodes.map(n => n.getStructuralFeature())
					});
					break;
				}
				case QualifierType.Modifier: {
					const modifier = qualifier.data;

					if (modifier.type === ModifierType.NodeRow) {
						const ring = new Ring(
							this.nodes.map(n => n.getStructuralFeature()),
							VectorAreaRingType.Outer
						);

						const nodes = ring.distributeNodes(modifier.spacing, modifier.randomness, modifier.descriptor);

						features.push(...nodes);
					} else {
						console.error(`Unexpected modifier ${modifier.type}`);
					}
					break;
				}
			}
		}

		return features;
	}

	private getFeaturesFromAreaTags(): VectorFeature[] {
		const features: VectorFeature[] = [];

		if (!this.isClosed()) {
			return features;
		}

		const qualifiers = new AreaQualifierFactory().fromTags(this.tags);

		if (!qualifiers) {
			return features;
		}

		for (const qualifier of qualifiers) {
			switch (qualifier.type) {
				case QualifierType.Descriptor: {
					const ring = new Ring(
						this.nodes.map(n => n.getStructuralFeature()),
						VectorAreaRingType.Outer
					);
					ring.fixDirection();

					features.push({
						type: 'area',
						osmReference: this.getOSMReference(),
						descriptor: qualifier.data,
						rings: [ring.getVectorAreaRing()],
						isBuildingPartInRelation: this.isBuildingPartInRelation
					});
					break;
				}
				case QualifierType.Modifier: {
					console.error(`Unexpected modifier ${qualifier.data.type}`);
					break;
				}
			}
		}

		return features;
	}

	public getFeatures(): VectorFeature[] {
		if (this.disableFeatureOutput) {
			return [];
		}

		if (!this.cachedFeatures) {
			this.cachedFeatures = [
				...this.getFeaturesFromPolylineTags(),
				...this.getFeaturesFromAreaTags()
			];
		}

		return this.cachedFeatures;
	}

	public getStructuralFeature(): VectorPolyline {
		if (!this.cachedStructuralFeature) {
			this.cachedStructuralFeature = {
				type: 'polyline',
				osmReference: null,
				descriptor: null,
				nodes: this.nodes.map(n => n.getStructuralFeature())
			};
		}

		return this.cachedStructuralFeature;
	}

	private getOSMReference(): OSMReference {
		return {
			type: OSMReferenceType.Way,
			id: this.osmElement.id
		};
	}
}