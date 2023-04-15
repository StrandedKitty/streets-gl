import {SegmentEntity} from "~/lib/tile-processing/powerline-graph/PowerlineGraph";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import {NodeType} from "~/lib/tile-processing/powerline-graph/PowerlineNode";
import Vec3 from "~/lib/math/Vec3";

// In Blender coordinate system
const WireSocketConfig: Record<NodeType, Vec3[]> = {
	[NodeType.Tower]: [
		new Vec3(-8.6597, -0.003158, 20.2559),
		new Vec3(-6.7063, -0, 27.766),
		new Vec3(7.00047, -0, 27.766),
		new Vec3(8.94836, -0.003158, 20.2559),
		new Vec3(0.142055, -0.040781, 20.2559)
	],
	[NodeType.Pole]: [
		new Vec3(-1, -0.000002, 9.00998),
		new Vec3(-0.5, -0.000002, 9.00998),
		new Vec3(0.5, -0.000002, 9.00998),
		new Vec3(1, -0.000002, 9.00998)
	],
	[NodeType.Ground]: [
		new Vec3(-1, 0, 0),
		new Vec3(-0.5, 0, 0),
		new Vec3(0.5, 0, 0),
		new Vec3(1, 0, 0),
		new Vec3(0, 0, 0)
	]
};
const WireMeshLength = 50;

export default class WireGroupBuilder {
	public build(segment: SegmentEntity, startHeight: number, endHeight: number, mercatorScale: number): Tile3DInstance[] {
		const instances: Tile3DInstance[] = [];

		const start = new Vec3(segment.start.position.x, startHeight, segment.start.position.y);
		const end = new Vec3(segment.end.position.x, endHeight, segment.end.position.y);
		const startType = segment.start.type;
		const endType = segment.end.type;

		if (startType === NodeType.Ground && endType === NodeType.Ground) {
			return [];
		}

		let startRot = segment.start.rotation;
		let endRot = segment.end.rotation;
		const dot = this.dotProduct(startRot, endRot);
		if (dot < 0) {
			endRot = endRot + Math.PI;
		}

		const socketsStart = WireSocketConfig[startType];
		const socketsEnd = WireSocketConfig[endType];
		const connectionsCount = Math.min(socketsStart.length, socketsEnd.length);

		for (let i = 0; i < connectionsCount; i++) {
			const socketFrom = socketsStart[i];
			const socketTo = socketsEnd[i];

			const socketFromScaled = Vec3.multiplyScalar(new Vec3(
				socketFrom.x,
				socketFrom.z,
				socketFrom.y
			), mercatorScale);
			const socketToScaled = Vec3.multiplyScalar(new Vec3(
				socketTo.x,
				socketTo.z,
				socketTo.y
			), mercatorScale);

			const socketFromRotated = Vec3.rotateAroundAxis(socketFromScaled, new Vec3(0, 1, 0), startRot);
			const socketToRotated = Vec3.rotateAroundAxis(socketToScaled, new Vec3(0, 1, 0), endRot);

			const segmentFrom = Vec3.add(start, socketFromRotated);
			const segmentTo = Vec3.add(end, socketToRotated);

			const instance = this.createWireSegment(segmentFrom, segmentTo, mercatorScale);

			instances.push(instance);
		}

		/*for (const socket of sockets) {
			const socketScaled = Vec3.multiplyScalar(new Vec3(
				socket.x,
				socket.z,
				socket.y
			), mercatorScale);

			const socketFromRotated = Vec3.rotateAroundAxis(socketScaled, new Vec3(0, 1, 0), startRot);
			const socketToRotated = Vec3.rotateAroundAxis(socketScaled, new Vec3(0, 1, 0), endRot);

			const segmentFrom = Vec3.add(start, socketFromRotated);
			const segmentTo = Vec3.add(end, socketToRotated);

			const instance = this.createWireSegment(segmentFrom, segmentTo, mercatorScale);

			instances.push(instance);
		}*/

		return instances;
	}

	private dotProduct(angle1: number, angle2: number): number {
		// Convert angles to unit vectors
		const u1 = [Math.cos(angle1), Math.sin(angle1)];
		const u2 = [Math.cos(angle2), Math.sin(angle2)];

		// Calculate dot product
		return u1[0] * u2[0] + u1[1] * u2[1];
	}

	private vectorToEulerRotation(vector: Vec3): Vec3 {
		const {x, y, z} = vector;
		const yaw = Math.atan2(x, z);
		const pitch = Math.atan2(-y, Math.sqrt(x * x + z * z));
		return new Vec3(pitch, yaw, 0);
	}

	private createWireSegment(from: Vec3, to: Vec3, mercatorScale: number): Tile3DInstance {
		const direction = Vec3.normalize(Vec3.sub(to, from));
		const euler = this.vectorToEulerRotation(direction);
		const mid = Vec3.lerp(from, to, 0.5);
		const length = Vec3.distance(from, to) / WireMeshLength;

		return {
			type: 'instance',
			instanceType: 'wire',
			x: mid.x,
			y: mid.y,
			z: mid.z,
			scaleX: length,
			scaleY: mercatorScale,
			scaleZ: mercatorScale,
			rotationX: 0,
			rotationY: euler.y + Math.PI / 2,
			rotationZ: euler.x
		};
	}
}