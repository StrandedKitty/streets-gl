import {NodeElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import Handler from './Handler';
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {ContainerType, VectorDescriptorFactory} from "~/lib/tile-processing/vector/VectorDescriptorFactory";
import {cleanupTags} from "~/lib/tile-processing/vector/utils";

export default class OSMNodeHandler implements Handler {
	private readonly x: number;
	private readonly y: number;
	private readonly osmElement: NodeElement;
	private readonly tags: Record<string, string>;
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: (VectorNode | VectorArea)[] = null;
	private cachedStructuralFeature: VectorNode = null;

	public constructor(osmElement: NodeElement, x: number, y: number) {
		this.x = x;
		this.y = y;
		this.osmElement = osmElement;
		this.tags = cleanupTags(osmElement.tags);
	}

	private getFeaturesFromTags(): (VectorNode | VectorArea)[] {
		const features: (VectorNode | VectorArea)[] = [];
		const parsed = VectorDescriptorFactory.parseNodeTags(this.tags);

		if (parsed) {
			switch (parsed.type) {
				case ContainerType.Descriptor: {
					features.push({
						type: 'node',
						x: this.x,
						y: this.y,
						rotation: 0,
						osmReference: this.getOSMReference(),
						descriptor: parsed.data
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

	public getFeatures(): (VectorNode | VectorArea)[] {
		if (!this.cachedFeatures) {
			this.cachedFeatures = this.getFeaturesFromTags();
		}

		return this.cachedFeatures;
	}

	public getStructuralFeature(): VectorNode {
		if (!this.cachedStructuralFeature) {
			this.cachedStructuralFeature = {
				type: 'node',
				x: this.x,
				y: this.y,
				rotation: 0,
				osmReference: null,
				descriptor: null
			};
		}

		return this.cachedStructuralFeature;
	}

	private getOSMReference(): OSMReference {
		return {
			type: OSMReferenceType.Node,
			id: this.osmElement.id
		};
	}

	public preventFeatureOutput(): void {
		this.disableFeatureOutput = true;
	}

	public markAsBuildingPartInRelation(): void {

	}
}