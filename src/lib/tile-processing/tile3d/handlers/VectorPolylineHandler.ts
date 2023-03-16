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
import {RoadSide} from "~/lib/tile-processing/tile3d/builders/RoadBuilder";
import {getRoadUV} from "~/lib/tile-processing/tile3d/utils";
import RoadGraph from "~/lib/road-graph/RoadGraph";

export default class VectorPolylineHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorPolylineDescriptor;
	private readonly vertices: Vec2[];
	private graph: RoadGraph<OSMReference> = null;

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

	public setRoadGraph(graph: RoadGraph<OSMReference>): void {
		if (this.descriptor.type === 'path' && this.descriptor.pathType === 'roadway') {
			this.graph = graph;

			this.graph.addRoad(this.osmReference, this.vertices, this.descriptor.width);
		}
	}

	private handlePath(): Tile3DProjectedGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(VectorPolylineHandler.getPathZIndex(this.descriptor.pathType));
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		let side: RoadSide = RoadSide.Both;

		if (this.descriptor.side === 'left') {
			side = RoadSide.Left;
		} else if (this.descriptor.side === 'right') {
			side = RoadSide.Right;
		}

		let uvParams: {minX: number; maxX: number};

		if (this.descriptor.type === 'path' && this.descriptor.pathType === 'roadway') {
			uvParams = getRoadUV(this.descriptor.lanesForward, this.descriptor.lanesBackward);
		} else {
			uvParams = {minX: 0, maxX: 1};
		}

		const pointStart = this.vertices[0];
		const pointEnd = this.vertices[this.vertices.length - 1];
		let vertexAdjacentToStart: Vec2 = null;
		let vertexAdjacentToEnd: Vec2 = null;

		if (!pointStart.equals(pointEnd) && this.graph) {
			const intersectionStart = this.graph.getIntersectionByPoint(pointStart);
			const intersectionEnd = this.graph.getIntersectionByPoint(pointEnd);

			if (intersectionStart && intersectionStart.directions.length === 2) {
				for (const {road, vertex} of intersectionStart.directions) {
					if (road.ref !== this.osmReference) {
						vertexAdjacentToStart = vertex.vector;
					}
				}
			}
			if (intersectionEnd && intersectionEnd.directions.length === 2) {
				for (const {road, vertex} of intersectionEnd.directions) {
					if (road.ref !== this.osmReference) {
						vertexAdjacentToEnd = vertex.vector;
					}
				}
			}
		}

		builder.addPath({
			width: this.descriptor.width,
			uvScaleY: 12,
			uvMinX: uvParams.minX,
			uvMaxX: uvParams.maxX,
			textureId: VectorPolylineHandler.getPathTextureId(this.descriptor.pathType),
			side,
			vertexAdjacentToStart,
			vertexAdjacentToEnd
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
			case "roadway": return 15;
			case "cycleway": return 8;
			case "railway": return 9;
			case "tramway": return 9;
		}
	}
}