import Handler from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Vec2 from "~/lib/math/Vec2";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DHuggingGeometry from "~/lib/tile-processing/tile3d/features/Tile3DHuggingGeometry";

export default class VectorPolylineHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorPolylineDescriptor;
	private readonly vertices: Vec2[];

	public constructor(feature: VectorPolyline) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.vertices = feature.nodes.map(node => new Vec2(node.x, node.y));
	}

	public getFeatures(): Tile3DFeature[] {
		switch (this.descriptor.type) {
			case 'path': {
				return [this.handlePath()];
			}
			case 'fence': {
				return [this.handleFence()];
			}
			case 'hedge': {
				return [this.handleHedge()];
			}
		}

		return [];
	}

	private handlePath(): Tile3DProjectedGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(VectorPolylineHandler.getPathZIndex(this.descriptor.pathType));
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		builder.addPath({
			width: this.descriptor.width,
			textureId: VectorPolylineHandler.getPathTextureId(this.descriptor.pathType)
		});

		return builder.getGeometry();
	}

	private handleFence(): Tile3DHuggingGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		builder.addFence({
			minHeight: this.descriptor.minHeight,
			height: this.descriptor.height,
			textureId: 14
		});

		const result = builder.getGeometry();
		return {...result, type: 'hugging'};
	}

	private handleHedge(): Tile3DHuggingGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		builder.addExtrudedPath({
			width: 1,
			height: 1.5,
			textureId: 12
		});

		const result = builder.getGeometry();
		return {...result, type: 'hugging'};
	}

	private static getPathZIndex(pathType: VectorPolylineDescriptor['pathType']): number {
		switch (pathType) {
			case "footway": return 2;
			case "cycleway": return 3;
			case "roadway": return 4;
			case "railway": return 5;
			case "tramway": return 6;
		}
	}

	private static getPathTextureId(pathType: VectorPolylineDescriptor['pathType']): number {
		switch (pathType) {
			case "footway": return 1;
			case "roadway": return 2;
			case "cycleway": return 8;
			case "railway": return 9;
			case "tramway": return 9;
		}
	}
}