import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import {CarModelBuffers, createCarBody, createCarWheel, createCarPartsFromGLB, GLBWheelPart} from "~/app/objects/models/CarModel";
import Vec3 from "~/lib/math/Vec3";

// Strata Phase 2 Increment 4 — THROWAWAY GLUE. The car split into separately-drawable parts:
// one body mesh + one reusable wheel mesh (placed/animated 4x by GBufferPass.renderCar with its
// own part matrix for spin / steer / suspension). Both meshes are built lazily by the scene's
// getObjectsToUpdateMesh() traversal, like every other RenderableObject3D.
export default class Car extends RenderableObject3D {
	// Strata Increment 4 Step B — throwaway A/B toggle (KeyB): when true, render the dropped GLB as a
	// single static body mesh instead of the procedural box + animated wheels. Default false (box).
	public static useGLB: boolean = false;

	public bodyMesh: AbstractMesh = null;
	public wheelMesh: AbstractMesh = null;

	// GLB parts (Step B): a body mesh + 4 axle-centered wheel meshes with their mount metadata.
	public glbBodyMesh: AbstractMesh = null;
	public glbWheelMeshes: AbstractMesh[] = [];
	public glbWheels: GLBWheelPart[] = [];
	public glbWheelRadius: number = 0.34;
	public glbReady: boolean = false;

	private readonly bodyBuffers: CarModelBuffers = createCarBody();
	private readonly wheelBuffers: CarModelBuffers = createCarWheel();

	public constructor() {
		super();

		const box = this.bodyBuffers.boundingBox;
		this.setBoundingBox(
			new Vec3(box.min.x, box.min.y, box.min.z),
			new Vec3(box.max.x, box.max.y, box.max.z)
		);
	}

	public isMeshReady(): boolean {
		return this.bodyMesh !== null && this.wheelMesh !== null;
	}

	private buildMesh(renderer: AbstractRenderer, buffers: CarModelBuffers): AbstractMesh {
		return renderer.createMesh({
			indexed: true,
			indices: buffers.indices,
			attributes: [
				renderer.createAttribute({
					name: 'position',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({data: buffers.position})
				}),
				renderer.createAttribute({
					name: 'normal',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({data: buffers.normal})
				}),
				renderer.createAttribute({
					name: 'color',
					size: 3,
					type: RendererTypes.AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Float,
					normalized: true,
					buffer: renderer.createAttributeBuffer({data: buffers.color})
				})
			]
		});
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (!this.bodyMesh) {
			this.bodyMesh = this.buildMesh(renderer, this.bodyBuffers);
		}

		if (!this.wheelMesh) {
			this.wheelMesh = this.buildMesh(renderer, this.wheelBuffers);
		}

		// Build the GLB parts once (best-effort; on failure the procedural box path keeps working).
		if (!this.glbReady) {
			try {
				const parts = createCarPartsFromGLB();
				this.glbBodyMesh = this.buildMesh(renderer, parts.body);
				this.glbWheels = parts.wheels;
				this.glbWheelRadius = parts.wheelRadius;
				this.glbWheelMeshes = parts.wheels.map(w => w ? this.buildMesh(renderer, w.buffers) : null);
				this.glbReady = true;
			} catch (e) {
				console.warn('[Strata] createCarPartsFromGLB failed, staying on procedural box:', e);
			}
		}
	}
}
