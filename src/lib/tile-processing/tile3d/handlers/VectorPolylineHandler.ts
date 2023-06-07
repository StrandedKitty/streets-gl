import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Tile3DProjectedGeometry, {ZIndexMap} from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
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
import {ProjectedTextures} from "~/lib/tile-processing/tile3d/textures";

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
				return this.handlePath();
			}
			case 'fence': {
				return [this.handleFence()];
			}
			case 'wall': {
				return [this.handleWall()];
			}
			case 'waterway': {
				return [this.handleWaterway()];
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

	private handlePath(): Tile3DFeature[] {
		const features: Tile3DFeature[] = [];
		const side = VectorPolylineHandler.getRoadSideFromDescriptor(this.descriptor.side);
		const params = VectorPolylineHandler.getPathParams(
			this.descriptor.pathType,
			this.descriptor.pathMaterial,
			this.descriptor.isRoadwayMarked,
			this.descriptor.lanesForward,
			this.descriptor.lanesBackward,
			this.descriptor.width,
			this.mercatorScale
		);
		const {vertices, vertexAdjacentToStart, vertexAdjacentToEnd} = this.getPathBuilderVertices();

		if (vertices.length < 2) {
			return features;
		}

		for (const path of params) {
			const builder = new Tile3DProjectedGeometryBuilder();
			builder.setZIndex(path.zIndex);
			builder.addRing(Tile3DRingType.Outer, vertices);

			builder.addPath({
				width: this.descriptor.width * this.mercatorScale * path.widthScale,
				uvMinX: path.uvMinX,
				uvMaxX: path.uvMaxX,
				textureId: path.textureId,
				uvFollowRoad: path.uvFollowRoad,
				uvScale: path.uvScale,
				uvScaleY: path.uvScaleY,
				side,
				vertexAdjacentToStart,
				vertexAdjacentToEnd
			});

			features.push(builder.getGeometry());

			if (path.needsUsageMask) {
				features.push(builder.getTerrainMaskGeometry());
			}
		}

		return features;
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
		} else if (intersection.directions.length > 2 && !intersection.userData.skip) {
			const dir = intersection.directions.find((dir: IntersectionDirection) => dir.road === this.graphRoad);

			if (dir && dir.trimmedEnd && vertices.length > 1) {
				const prevVertexIndex = type === 'first' ? 1 : vertices.length - 2;

				if (dir.trimmedEnd.equals(vertices[prevVertexIndex])) {
					if (type === 'first') {
						adjacentVertex = vertices[0];
						vertices.shift();
					} else {
						adjacentVertex = vertices[vertices.length - 1];
						vertices.pop();
					}
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

		const {width, textureId} = VectorPolylineHandler.getFenceParams(
			this.descriptor.fenceMaterial,
			this.descriptor.height
		);

		builder.addFence({
			minHeight: (this.descriptor.minHeight ?? 0) * this.mercatorScale,
			height: this.descriptor.height * this.mercatorScale,
			width: width,
			textureId: textureId
		});

		const result = builder.getGeometry();
		return {...result, type: 'hugging'};
	}

	private handleWall(): Tile3DHuggingGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		const params = VectorPolylineHandler.getWallParams(this.descriptor.wallType);

		builder.addExtrudedPath({
			width: 0.8 * this.mercatorScale,
			height: this.descriptor.height * this.mercatorScale,
			textureId: params.textureId,
			textureScaleX: params.uvScaleX,
			textureScaleY: params.uvScaleY
		});

		const result = builder.getGeometry();
		return {...result, type: 'hugging'};
	}

	private handleWaterway(): Tile3DProjectedGeometry {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(ZIndexMap.Waterway);
		builder.addRing(Tile3DRingType.Outer, this.vertices);

		builder.addPath({
			width: this.descriptor.width * this.mercatorScale,
			uvFollowRoad: false,
			textureId: ProjectedTextures.Water
		});

		return builder.getGeometry();
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

	private static getPathParams(
		pathType: VectorPolylineDescriptor['pathType'],
		pathMaterial: VectorPolylineDescriptor['pathMaterial'],
		isRoadwayMarked: boolean,
		lanesForward: number,
		lanesBackward: number,
		width: number,
		mercatorScale: number
	): {
		textureId: number;
		widthScale: number;
		uvScale: number;
		uvScaleY: number;
		uvMinX: number;
		uvMaxX: number;
		uvFollowRoad: boolean;
		zIndex: number;
		needsUsageMask: boolean;
	}[] {
		const params = [{
			textureId: 0,
			widthScale: 1,
			uvScale: 1,
			uvScaleY: 1,
			uvMinX: 0,
			uvMaxX: 1,
			zIndex: 0,
			uvFollowRoad: false,
			needsUsageMask: false
		}];

		switch (pathType) {
			case 'footway': {
				switch (pathMaterial) {
					case 'wood': {
						params[0].textureId = ProjectedTextures.WoodRoad;
						params[0].zIndex = ZIndexMap.WoodFootway;
						params[0].uvFollowRoad = true;
						params[0].uvScaleY = 4;
						params[0].uvMaxX = width / 4;
						break;
					}
					default: {
						params[0].textureId = ProjectedTextures.Pavement;
						params[0].zIndex = ZIndexMap.Footway;
						params[0].uvFollowRoad = false;
						params[0].uvScale = 8;
					}
				}
				break;
			}
			case 'roadway': {
				const uvXParams = getRoadUV(lanesForward, lanesBackward);
				params[0].uvMinX = uvXParams.minX;
				params[0].uvMaxX = uvXParams.maxX;
				params[0].uvFollowRoad = true;

				switch (pathMaterial) {
					case 'asphalt': {
						params[0].textureId = isRoadwayMarked ? ProjectedTextures.AsphaltRoad : ProjectedTextures.AsphaltUnmarkedRoad;
						params[0].zIndex = ZIndexMap.AsphaltRoadway;
						params[0].uvScaleY = 12;
						params[0].needsUsageMask = true;
						break;
					}
					case 'concrete': {
						params[0].textureId = isRoadwayMarked ? ProjectedTextures.ConcreteRoad : ProjectedTextures.ConcreteUnmarkedRoad;
						params[0].zIndex = ZIndexMap.ConcreteRoadway;
						params[0].uvScaleY = 12;
						params[0].needsUsageMask = true;
						break;
					}
					case 'wood': {
						params[0].textureId = ProjectedTextures.WoodRoad;
						params[0].zIndex = ZIndexMap.WoodRoadway;
						params[0].uvScaleY = 4;
						params[0].uvMinX = 0;
						params[0].uvMaxX = width * mercatorScale / 4;
						params[0].needsUsageMask = true;
						break;
					}
					case 'cobblestone': {
						params[0].textureId = ProjectedTextures.Cobblestone;
						params[0].zIndex = ZIndexMap.CobblestoneRoadway;
						params[0].uvMinX = 0;
						params[0].uvMaxX = width * mercatorScale / 6;
						params[0].uvScaleY = 6;
						params[0].needsUsageMask = true;
						break;
					}
					case 'dirt': {
						params[0].uvFollowRoad = true;
						params[0].textureId = ProjectedTextures.DirtRoad;
						params[0].zIndex = ZIndexMap.DirtRoadway;
						params[0].widthScale = 1.7;
						params[0].uvMinX = 0;
						params[0].uvMaxX = 1;
						params[0].uvScaleY = width * mercatorScale;
						break;
					}
					case 'sand': {
						params[0].uvFollowRoad = true;
						params[0].textureId = ProjectedTextures.SandRoad;
						params[0].zIndex = ZIndexMap.SandRoadway;
						params[0].widthScale = 1.7;
						params[0].uvMinX = 0;
						params[0].uvMaxX = 1;
						params[0].uvScaleY = width * mercatorScale;
						break;
					}
				}
				break;
			}
			case 'cycleway': {
				params[0].textureId = ProjectedTextures.Cycleway;
				params[0].zIndex = ZIndexMap.Cycleway;
				params[0].uvFollowRoad = false;
				params[0].uvScale = 8;
				break;
			}
			case 'tramway': {
				params[0].textureId = ProjectedTextures.Rail;
				params[0].zIndex = ZIndexMap.Rail;
				params[0].widthScale = 2;
				params[0].uvFollowRoad = true;
				params[0].uvMinX = 0;
				params[0].uvMaxX = 1;
				params[0].uvScaleY = width * mercatorScale * 4;
				break;
			}
			case 'railway': {
				params[0].textureId = ProjectedTextures.Railway;
				params[0].zIndex = ZIndexMap.Railway;
				params[0].widthScale = 2;
				params[0].uvFollowRoad = true;
				params[0].uvMinX = 0;
				params[0].uvMaxX = 1;
				params[0].uvScaleY = width * mercatorScale * 4;

				params.push({
					textureId: ProjectedTextures.RailwayTop,
					zIndex: ZIndexMap.RailwayOverlay,
					widthScale: 2,
					uvFollowRoad: true,
					uvMinX: 0,
					uvMaxX: 1,
					uvScaleY: width * mercatorScale * 4,
					uvScale: 1,
					needsUsageMask: false
				});
				params.push({
					textureId: ProjectedTextures.Rail,
					zIndex: ZIndexMap.Rail,
					widthScale: 2,
					uvFollowRoad: true,
					uvMinX: 0,
					uvMaxX: 1,
					uvScaleY: width * mercatorScale * 4,
					uvScale: 1,
					needsUsageMask: false
				});
				break;
			}
			case 'runway': {
				params[0].uvFollowRoad = false;
				params[0].textureId = ProjectedTextures.Asphalt;
				params[0].zIndex = ZIndexMap.Runway;
				params[0].uvScale = 10;
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

	private static getFenceParams(
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
			wood: {textureId: ProjectedTextures.WoodFence, widthRatio: 1},
			concrete: {textureId: ProjectedTextures.ConcreteFence, widthRatio: 2},
			chainLink: {textureId: ProjectedTextures.ChainLinkFence, widthRatio: 1},
			metal: {textureId: ProjectedTextures.MetalFence, widthRatio: 1.64}
		};

		const entry = textureTable[fenceType];

		return {
			textureId: entry.textureId,
			width: height * entry.widthRatio
		};
	}

	private static getWallParams(
		type: VectorPolylineDescriptor['wallType']
	): {
		textureId: number;
		uvScaleX: number;
		uvScaleY: number;
	} {
		const textureTable: Record<VectorPolylineDescriptor['wallType'], {
			textureId: number;
			scaleX: number;
			scaleY: number;
		}> = {
			stone: {textureId: ProjectedTextures.StoneWall, scaleX: 4, scaleY: 4},
			concrete: {textureId: ProjectedTextures.ConcreteWall, scaleX: 4.5, scaleY: 3},
			hedge: {textureId: ProjectedTextures.Hedge, scaleX: 3, scaleY: 3},
		};

		const entry = textureTable[type];

		return {
			textureId: entry.textureId,
			uvScaleX: entry.scaleX,
			uvScaleY: entry.scaleY
		};
	}
}