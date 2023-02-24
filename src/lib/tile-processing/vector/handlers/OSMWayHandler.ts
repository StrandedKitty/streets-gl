import OSMNodeHandler from "~/lib/tile-processing/vector/handlers/OSMNodeHandler";
import {WayElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorArea, {VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import Handler from "~/lib/tile-processing/vector/handlers/Handler";
import {ContainerType, VectorDescriptorFactory,} from "~/lib/tile-processing/vector/VectorDescriptorFactory";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {ModifierType} from "~/lib/tile-processing/vector/modifiers";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import {cleanupTags} from "~/lib/tile-processing/vector/utils";
import Ring from "~/lib/tile-processing/vector/handlers/Ring";

export default class OSMWayHandler implements Handler {
	private readonly osmElement: WayElement;
	private readonly tags: Record<string, string>;
	private readonly nodes: OSMNodeHandler[];
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: (VectorArea | VectorPolyline | VectorNode)[] = null;
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

	private getFeaturesFromPolylineTags(): (VectorArea | VectorPolyline | VectorNode)[] {
		const features: (VectorArea | VectorPolyline | VectorNode)[] = [];
		const parsed = VectorDescriptorFactory.parsePolylineTags(this.tags);

		if (parsed) {
			switch (parsed.type) {
				case ContainerType.Descriptor: {
					features.push({
						type: 'polyline',
						osmReference: this.getOSMReference(),
						descriptor: parsed.data,
						nodes: this.nodes.map(n => n.getStructuralFeature())
					});
					break;
				}
				case ContainerType.Modifier: {
					const modifier = parsed.data;

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

	private getFeaturesFromAreaTags(): (VectorArea | VectorPolyline | VectorNode)[] {
		const features: (VectorArea | VectorPolyline | VectorNode)[] = [];

		if (this.isClosed()) {
			const parsed = VectorDescriptorFactory.parseAreaTags(this.tags);

			if (parsed) {
				switch (parsed.type) {
					case ContainerType.Descriptor: {
						const ring = new Ring(
							this.nodes.map(n => n.getStructuralFeature()),
							VectorAreaRingType.Outer
						);
						ring.fixDirection();

						features.push({
							type: 'area',
							osmReference: this.getOSMReference(),
							descriptor: parsed.data,
							rings: [ring.getVectorAreaRing()]
						});
						break;
					}
					case ContainerType.Modifier: {
						console.error(`Unexpected modifier ${parsed.data.type}`);
						break;
					}
				}
			}
		}

		return features;
	}

	public getFeatures(): (VectorArea | VectorPolyline | VectorNode)[] {
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