import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
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
	private mercatorScale: number = 1;
	private graph: RoadGraph<VectorPolylineHandler> = null;
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

	public setRoadGraph(graph: RoadGraph<VectorPolylineHandler>): void {
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
				graph.addRoad(this, this.vertices, this.descriptor.width * this.mercatorScale, type);
			}
		}
	}

	private handlePath(): Tile3DProjectedGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(VectorPolylineHandler.getPathZIndex(this.descriptor.pathType));
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		const side = VectorPolylineHandler.getRoadSideFromDescriptor(this.descriptor.side);
		const uvAndTextureParams = VectorPolylineHandler.getPathTextureIdAndUV(
			this.descriptor.pathType,
			this.descriptor.pathMaterial,
			this.descriptor.lanesForward,
			this.descriptor.lanesBackward,
			this.descriptor.width
		);

		const pointStart = this.vertices[0];
		const pointEnd = this.vertices[this.vertices.length - 1];
		let vertexAdjacentToStart: Vec2 = null;
		let vertexAdjacentToEnd: Vec2 = null;

		if (!pointStart.equals(pointEnd) && this.graph) {
			const intersectionStart = this.graph.getIntersectionByPoint(pointStart, this.graphGroup);
			const intersectionEnd = this.graph.getIntersectionByPoint(pointEnd, this.graphGroup);

			if (intersectionStart) {
				if (intersectionStart.directions.length === 2) {
					for (const {road, vertex} of intersectionStart.directions) {
						if (road.ref !== this) {
							vertexAdjacentToStart = vertex.vector;
						}
					}
				} else if (intersectionStart.directions.length > 2) {
					const dir = intersectionStart.directions.find(dir => dir.road.ref === this);

					if (dir && dir.trimmedEnd && this.vertices.length > 1) {
						if (dir.trimmedEnd.equals(this.vertices[1])) {
							this.vertices.shift();
						} else {
							const start = this.vertices[0];
							start.set(dir.trimmedEnd.x, dir.trimmedEnd.y);
						}
					}
				}
			}
			if (intersectionEnd) {
				if (intersectionEnd.directions.length === 2) {
					for (const {road, vertex} of intersectionEnd.directions) {
						if (road.ref !== this) {
							vertexAdjacentToEnd = vertex.vector;
						}
					}
				} else if (intersectionEnd.directions.length > 2) {
					const dir = intersectionEnd.directions.find(dir => dir.road.ref === this);

					if (dir && dir.trimmedEnd && this.vertices.length > 1) {
						if (dir.trimmedEnd.equals(this.vertices[this.vertices.length - 2])) {
							this.vertices.pop();
						} else {
							const end = this.vertices[this.vertices.length - 1];
							end.set(dir.trimmedEnd.x, dir.trimmedEnd.y);
						}
					}
				}
			}
		}

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

	public getIntersectionMaterial(): 'asphalt' | 'concrete' {
		if (this.descriptor.pathMaterial === 'concrete') {
			return 'concrete';
		}

		return 'asphalt';
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
		width: number
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
						params.uvMaxX = width / 4;
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
				params.uvScale = 12;
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
}