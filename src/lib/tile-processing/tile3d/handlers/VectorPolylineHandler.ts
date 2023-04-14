import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Vec2 from "~/lib/math/Vec2";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DHuggingGeometry from "~/lib/tile-processing/tile3d/features/Tile3DHuggingGeometry";
import {RoadSide} from "~/lib/tile-processing/tile3d/builders/RoadBuilder";
import {getRoadUV} from "~/lib/tile-processing/tile3d/utils";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import Road from "~/lib/road-graph/Road";
import Intersection, {IntersectionDirection} from "~/lib/road-graph/Intersection";
import {VectorAreaDescriptor, VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

export default class VectorPolylineHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorPolylineDescriptor;
	private readonly vertices: Vec2[];
	private mercatorScale: number = 1;
	private graph: RoadGraph = null;
	private graphRoad: Road = null;
	private graphGroup: number = -1;

	public constructor(feature: VectorPolyline) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.vertices = feature.nodes.map(node => new Vec2(node.x, node.y));
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		return null;
	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
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

	public setRoadGraph(graph: RoadGraph): void {
		if (this.descriptor.type === 'path') {
			let type = -1;

			switch (this.descriptor.pathType) {
				case 'roadway':
					type = 0;
					break;
				case 'footway':
					type = 1;
					break;
				case 'cycleway':
					type = 2;
					break;
				case 'railway':
					type = 3;
					break;
				case 'tramway':
					type = 4;
					break;
			}

			if (type !== -1) {
				this.graph = graph;
				this.graphGroup = type;
				this.graphRoad = graph.addRoad(this.vertices, this.descriptor.width * this.mercatorScale, type);
			}
		}
	}

	public getGraphRoad(): Road {
		return this.graphRoad;
	}

	private handlePath(): Tile3DProjectedGeometry {
		const side = VectorPolylineHandler.getRoadSideFromDescriptor(this.descriptor.side);
		const uvAndTextureParams = VectorPolylineHandler.getPathTextureIdAndUV(
			this.descriptor.pathType,
			this.descriptor.pathMaterial,
			this.descriptor.lanesForward,
			this.descriptor.lanesBackward,
			this.descriptor.width,
			this.mercatorScale
		);
		const {vertices, vertexAdjacentToStart, vertexAdjacentToEnd} = this.getPathBuilderVertices();

		if (vertices.length < 2) {
			return null;
		}

		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(VectorPolylineHandler.getPathZIndex(this.descriptor.pathType));
		builder.addRing(Tile3DRingType.Outer, vertices);

		builder.addPath({
			width: this.descriptor.width * this.mercatorScale,
			uvMinX: uvAndTextureParams.uvMinX,
			uvMaxX: uvAndTextureParams.uvMaxX,
			textureId: uvAndTextureParams.textureId,
			uvFollowRoad: uvAndTextureParams.uvFollowRoad,
			uvScale: uvAndTextureParams.uvScale,
			uvScaleY: uvAndTextureParams.uvScaleY,
			side,
			vertexAdjacentToStart,
			vertexAdjacentToEnd
		});

		return builder.getGeometry();
	}

	private getPathBuilderVertices(): {
		vertices: Vec2[];
		vertexAdjacentToStart: Vec2;
		vertexAdjacentToEnd: Vec2;
	} {
		const vertices: Vec2[] = [...this.vertices];
		const pointStart = vertices[0];
		const pointEnd = vertices[vertices.length - 1];

		let vertexAdjacentToStart: Vec2 = null;
		let vertexAdjacentToEnd: Vec2 = null;

		if (!pointStart.equals(pointEnd) && this.graphRoad) {
			const intersectionStart = this.graph.getIntersectionByPoint(pointStart, this.graphGroup);
			const intersectionEnd = this.graph.getIntersectionByPoint(pointEnd, this.graphGroup);

			if (intersectionStart && vertices.length > 1) {
				vertexAdjacentToStart = this.processPathEnd(vertices, intersectionStart, 'first');
			}
			if (intersectionEnd && vertices.length > 1) {
				vertexAdjacentToEnd = this.processPathEnd(vertices, intersectionEnd, 'last');
			}
		}

		return {
			vertices,
			vertexAdjacentToStart,
			vertexAdjacentToEnd
		};
	}

	private processPathEnd(vertices: Vec2[], intersection: Intersection, type: 'first' | 'last'): Vec2 {
		let adjacentVertex: Vec2 = null;

		if (intersection.directions.length === 2) {
			for (const {road, vertex} of intersection.directions) {
				const prevVertexIndex = type === 'first' ? 1 : vertices.length - 2;

				if (
					road !== this.graphRoad &&
					!vertex.vector.equals(vertices[prevVertexIndex])
				) {
					adjacentVertex = vertex.vector;
				}
			}
		} else if (intersection.directions.length > 2) {
			const dir = intersection.directions.find((dir: IntersectionDirection) => dir.road === this.graphRoad);

			if (dir && dir.trimmedEnd && vertices.length > 1) {
				const prevVertexIndex = type === 'first' ? 1 : vertices.length - 2;

				if (dir.trimmedEnd.equals(vertices[prevVertexIndex])) {
					vertices.shift();
				} else {
					const vertexIndex = type === 'first' ? 0 : vertices.length - 1;

					vertices[vertexIndex].set(dir.trimmedEnd.x, dir.trimmedEnd.y);
				}
			}
		}

		return adjacentVertex;
	}

	private handleFence(): Tile3DHuggingGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		const {width, textureId} = VectorPolylineHandler.getFenceTextureIdAndWidth(
			this.descriptor.fenceMaterial,
			this.descriptor.height
		);

		builder.addFence({
			minHeight: this.descriptor.minHeight,
			height: this.descriptor.height,
			width: width,
			textureId: textureId
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

	public getIntersectionMaterial(): VectorAreaDescriptor['intersectionMaterial'] {
		if (this.descriptor.pathMaterial === 'concrete') {
			return 'concrete';
		}

		if (this.descriptor.pathMaterial === 'asphalt') {
			return 'asphalt';
		}

		if (this.descriptor.pathMaterial === 'cobblestone') {
			return 'cobblestone';
		}

		return null;
	}

	private static getPathZIndex(pathType: VectorPolylineDescriptor['pathType']): number {
		switch (pathType) {
			case "footway":
				return 2;
			case "cycleway":
				return 3;
			case "roadway":
				return 4;
			case "railway":
				return 5;
			case "tramway":
				return 6;
			case "runway":
				return 7;
		}
	}

	private static getPathTextureIdAndUV(
		pathType: VectorPolylineDescriptor['pathType'],
		pathMaterial: VectorPolylineDescriptor['pathMaterial'],
		lanesForward: number,
		lanesBackward: number,
		width: number,
		mercatorScale: number
	): {
		textureId: number;
		uvScale: number;
		uvScaleY: number;
		uvMinX: number;
		uvMaxX: number;
		uvFollowRoad: boolean;
	} {
		const params = {
			textureId: 0,
			uvScale: 1,
			uvScaleY: 1,
			uvMinX: 0,
			uvMaxX: 1,
			uvFollowRoad: false
		};

		switch (pathType) {
			case "footway": {
				switch (pathMaterial) {
					case "wood": {
						params.textureId = 19;
						params.uvFollowRoad = true;
						params.uvScaleY = 4;
						params.uvMaxX = width / 4;
						break;
					}
					default: {
						params.textureId = 1;
						params.uvFollowRoad = false;
						params.uvScale = 8;
					}
				}
				break;
			}
			case "roadway": {
				const uvXParams = getRoadUV(lanesForward, lanesBackward);
				params.uvMinX = uvXParams.minX;
				params.uvMaxX = uvXParams.maxX;
				params.uvFollowRoad = true;

				switch (pathMaterial) {
					case "asphalt": {
						params.textureId = 15;
						params.uvScaleY = 12;
						break;
					}
					case "concrete": {
						params.textureId = 17;
						params.uvScaleY = 12;
						break;
					}
					case "wood": {
						params.textureId = 19;
						params.uvScaleY = 4;
						params.uvMinX = 0;
						params.uvMaxX = width / 4;
						break;
					}
					case "cobblestone": {
						params.textureId = 3;
						params.uvMinX = 0;
						params.uvMaxX = width * mercatorScale / 6;
						params.uvScaleY = 6;
						break;
					}
				}
				break;
			}
			case "cycleway": {
				params.textureId = 8;
				params.uvFollowRoad = false;
				params.uvScale = 8;
				break;
			}
			case "tramway":
			case "railway": {
				params.textureId = 9;
				params.uvFollowRoad = true;
				params.uvScaleY = 10;
				break;
			}
			case "runway": {
				params.uvFollowRoad = false;
				params.textureId = 2;
				params.uvScale = 10;

				break;
			}
		}

		return params;
	}

	private static getRoadSideFromDescriptor(descriptorValue: VectorPolylineDescriptor['side']): RoadSide {
		if (descriptorValue === 'left') {
			return RoadSide.Left;
		}

		if (descriptorValue === 'right') {
			return RoadSide.Right;
		}

		return RoadSide.Both;
	}

	private static getFenceTextureIdAndWidth(
		fenceType: VectorPolylineDescriptor['fenceMaterial'],
		height: number
	): {
		textureId: number;
		width: number;
	} {
		const textureTable: Record<VectorPolylineDescriptor['fenceMaterial'], {
			textureId: number;
			widthRatio: number;
		}> = {
			wood: {textureId: 13, widthRatio: 1},
			concrete: {textureId: 13,widthRatio: 2},
			chainLink: {textureId: 25, widthRatio: 1},
			metal: {textureId: 26, widthRatio: 1.64}
		};

		const entry = textureTable[fenceType];

		return {
			textureId: entry.textureId,
			width: height * entry.widthRatio
		};
	}
}