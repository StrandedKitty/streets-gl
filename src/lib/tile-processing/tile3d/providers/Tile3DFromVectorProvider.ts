import Tile3DFeatureCollection from "~/lib/tile-processing/tile3d/features/Tile3DFeatureCollection";
import Tile3DFeatureProvider from "~/lib/tile-processing/tile3d/providers/Tile3DFeatureProvider";
import CombinedVectorFeatureProvider from "~/lib/tile-processing/vector/providers/CombinedVectorFeatureProvider";
import Handler from "~/lib/tile-processing/tile3d/handlers/Handler";
import VectorNodeHandler from "~/lib/tile-processing/tile3d/handlers/VectorNodeHandler";
import VectorPolylineHandler from "~/lib/tile-processing/tile3d/handlers/VectorPolylineHandler";
import VectorAreaHandler from "~/lib/tile-processing/tile3d/handlers/VectorAreaHandler";
import OSMNodeHandler from "~/lib/tile-processing/vector/handlers/OSMNodeHandler";
import OSMWayHandler from "~/lib/tile-processing/vector/handlers/OSMWayHandler";
import OSMRelationHandler from "~/lib/tile-processing/vector/handlers/OSMRelationHandler";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DBuffers, {
	Tile3DBuffersExtruded,
	Tile3DBuffersProjected
} from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Utils from "~/app/Utils";
import * as Simplify from "simplify-js";

export default class Tile3DFromVectorProvider extends Tile3DFeatureProvider {
	private vectorProvider: CombinedVectorFeatureProvider = new CombinedVectorFeatureProvider();

	public async getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number;
		}
	): Promise<Tile3DFeatureCollection> {
		const vectorTile = await this.vectorProvider.getCollection({x, y, zoom});
		const handlers = Tile3DFromVectorProvider.createHandlersFromVectorFeatureCollection(vectorTile);

		return Tile3DFromVectorProvider.getFeaturesFromHandlers(handlers);
	}

	private static createHandlersFromVectorFeatureCollection(collection: VectorFeatureCollection): Handler[] {
		const handlers: Handler[] = [];

		for (const feature of collection.nodes) {
			handlers.push(new VectorNodeHandler(feature));
		}

		for (const feature of collection.polylines) {
			feature.nodes = Tile3DFromVectorProvider.simplifyNodes(feature.nodes);
			handlers.push(new VectorPolylineHandler(feature));
		}

		for (const feature of collection.areas) {
			for (const ring of feature.rings) {
				ring.nodes = Tile3DFromVectorProvider.simplifyNodes(ring.nodes);
			}
			handlers.push(new VectorAreaHandler(feature));
		}

		return handlers;
	}

	private static simplifyNodes(nodes: VectorNode[]): VectorNode[] {
		return <VectorNode[]>Simplify(nodes, 0.5, false);
	}

	private static getFeaturesFromHandlers(
		handlers: (VectorNodeHandler | VectorPolylineHandler | VectorAreaHandler)[]
	): Tile3DFeatureCollection {
		const collection: Tile3DFeatureCollection = {
			extruded: [],
			projected: [],
			instances: []
		};

		for (const handler of handlers) {
			const output = handler.getFeatures();

			if (output) {
				for (const feature of output) {
					switch (feature.type) {
						case 'instance':
							collection.instances.push(feature as Tile3DInstance);
							break;
						case 'projected':
							collection.projected.push(feature as Tile3DProjectedGeometry);
							break;
						case 'extruded':
							collection.extruded.push(feature as Tile3DExtrudedGeometry);
							break;
					}
				}
			}
		}

		return collection;
	}
}