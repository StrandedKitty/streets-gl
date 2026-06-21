import AABB3D from "~/lib/math/AABB3D";
import Vec3 from "~/lib/math/Vec3";
import Mat4 from "~/lib/math/Mat4";
import ResourceLoader from "~/app/world/ResourceLoader";

// Strata Phase 2 Increment 4 — THROWAWAY PLACEHOLDER. A procedurally built car split into
// SEPARATE animated parts: a body (lower body + cabin) and a single reusable WHEEL (a cylinder
// with a contrasting spoke bar so its spin is visible). The four wheels are placed + animated at
// render time (spin / steer / per-wheel suspension) by GBufferPass.renderCar, each drawn with its
// own part matrix on top of the car's full transform. No binary assets / no licensing concerns;
// this whole file is disposable glue and stays as the fallback once a real glTF is dropped in.
//
// Built in METERS. Car frame: nose = +X, up = +Y, lateral = +Z. The body rests so the wheels
// touch y = 0; each wheel mesh is centered on its own axle (origin) so spin is a clean Z-rotation.

// Geometry constants — also consumed by DriveControlsNavigator for per-wheel terrain sampling.
export const CarBodyLength = 4.3;
export const CarBodyWidth = 1.85;
export const WheelRadius = 0.34;
export const WheelWidth = 0.26;

// Wheel contact points in the car-local frame (nose = +X, up = +Y, lateral = +Z).
export const CarWheelOffsetX = CarBodyLength / 2 - 0.75; // front (+) / rear (-)
export const CarWheelOffsetZ = CarBodyWidth / 2 - WheelWidth / 2; // lateral

// The four wheel mount points, in a fixed order [FL, FR, RL, RR] that DriveControlsNavigator's
// suspension array and GBufferPass.renderCar both rely on. `front` wheels also steer.
export const CarWheelMounts: {x: number; z: number; front: boolean}[] = [
	{x: CarWheelOffsetX, z: CarWheelOffsetZ, front: true},   // FL
	{x: CarWheelOffsetX, z: -CarWheelOffsetZ, front: true},  // FR
	{x: -CarWheelOffsetX, z: CarWheelOffsetZ, front: false}, // RL
	{x: -CarWheelOffsetX, z: -CarWheelOffsetZ, front: false} // RR
];

export interface CarModelBuffers {
	position: Float32Array;
	normal: Float32Array;
	color: Uint8Array; // RGB per vertex, normalized in the shader
	indices: Uint32Array;
	boundingBox: AABB3D;
}

interface MeshArrays {
	positions: number[];
	normals: number[];
	colors: number[];
	indices: number[];
}

function newArrays(): MeshArrays {
	return {positions: [], normals: [], colors: [], indices: []};
}

function finalize(a: MeshArrays, box: AABB3D): CarModelBuffers {
	return {
		position: new Float32Array(a.positions),
		normal: new Float32Array(a.normals),
		color: new Uint8Array(a.colors),
		indices: new Uint32Array(a.indices),
		boundingBox: box
	};
}

// Pushes one axis-aligned box (flat per-face normals + a solid color) into the arrays.
function addBox(
	a: MeshArrays,
	cx: number, cy: number, cz: number,
	sx: number, sy: number, sz: number,
	color: [number, number, number]
): void {
	const hx = sx / 2, hy = sy / 2, hz = sz / 2;

	const c = [
		[cx - hx, cy - hy, cz - hz], // 0
		[cx + hx, cy - hy, cz - hz], // 1
		[cx + hx, cy + hy, cz - hz], // 2
		[cx - hx, cy + hy, cz - hz], // 3
		[cx - hx, cy - hy, cz + hz], // 4
		[cx + hx, cy - hy, cz + hz], // 5
		[cx + hx, cy + hy, cz + hz], // 6
		[cx - hx, cy + hy, cz + hz], // 7
	];

	const faces: [number[], number[]][] = [
		[[1, 5, 6, 2], [1, 0, 0]],  // +X
		[[4, 0, 3, 7], [-1, 0, 0]], // -X
		[[3, 2, 6, 7], [0, 1, 0]],  // +Y
		[[4, 5, 1, 0], [0, -1, 0]], // -Y
		[[5, 4, 7, 6], [0, 0, 1]],  // +Z
		[[0, 1, 2, 3], [0, 0, -1]], // -Z
	];

	for (const [quad, normal] of faces) {
		const base = a.positions.length / 3;

		for (const ci of quad) {
			a.positions.push(c[ci][0], c[ci][1], c[ci][2]);
			a.normals.push(normal[0], normal[1], normal[2]);
			a.colors.push(color[0], color[1], color[2]);
		}

		a.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
	}
}

// Cylinder with its axis along Z (the wheel's spin axle), centered at the origin. Tread on the
// sides + two flat hub caps. Winding is irrelevant (the Car material is double-sided) but normals
// drive the lighting, so they're set correctly.
function addWheelCylinder(
	a: MeshArrays,
	radius: number, halfWidth: number, segments: number,
	sideColor: [number, number, number], capColor: [number, number, number]
): void {
	// Tread (side) quads.
	for (let i = 0; i < segments; i++) {
		const a0 = (i / segments) * Math.PI * 2;
		const a1 = ((i + 1) / segments) * Math.PI * 2;
		const c0 = Math.cos(a0), s0 = Math.sin(a0);
		const c1 = Math.cos(a1), s1 = Math.sin(a1);
		const base = a.positions.length / 3;

		const verts = [
			[c0 * radius, s0 * radius, -halfWidth, c0, s0, 0],
			[c1 * radius, s1 * radius, -halfWidth, c1, s1, 0],
			[c1 * radius, s1 * radius, halfWidth, c1, s1, 0],
			[c0 * radius, s0 * radius, halfWidth, c0, s0, 0],
		];

		for (const v of verts) {
			a.positions.push(v[0], v[1], v[2]);
			a.normals.push(v[3], v[4], v[5]);
			a.colors.push(sideColor[0], sideColor[1], sideColor[2]);
		}

		a.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
	}

	// Two hub caps (triangle fans).
	for (const [zc, nz] of [[-halfWidth, -1], [halfWidth, 1]] as [number, number][]) {
		const center = a.positions.length / 3;

		a.positions.push(0, 0, zc);
		a.normals.push(0, 0, nz);
		a.colors.push(capColor[0], capColor[1], capColor[2]);

		const ringBase = a.positions.length / 3;

		for (let i = 0; i <= segments; i++) {
			const ang = (i / segments) * Math.PI * 2;

			a.positions.push(Math.cos(ang) * radius, Math.sin(ang) * radius, zc);
			a.normals.push(0, 0, nz);
			a.colors.push(capColor[0], capColor[1], capColor[2]);
		}

		for (let i = 0; i < segments; i++) {
			a.indices.push(center, ringBase + i, ringBase + i + 1);
		}
	}
}

// Body + cabin (no wheels). Per-part vertex colors.
export function createCarBody(): CarModelBuffers {
	const a = newArrays();

	const bodyColor: [number, number, number] = [200, 55, 45];  // warm red
	const cabinColor: [number, number, number] = [35, 40, 50];  // dark glassy grey

	// Lower body: sits just above the wheel contact point.
	addBox(a, 0, WheelRadius + 0.35, 0, CarBodyLength, 0.7, CarBodyWidth, bodyColor);
	// Cabin: shorter, narrower, set slightly back, on top of the body.
	addBox(a, -0.25, WheelRadius + 0.95, 0, 2.1, 0.6, CarBodyWidth - 0.25, cabinColor);

	return finalize(a, new AABB3D(
		new Vec3(-CarBodyLength / 2, 0, -CarBodyWidth / 2),
		new Vec3(CarBodyLength / 2, WheelRadius + 1.25, CarBodyWidth / 2)
	));
}

// One reusable wheel, centered on its axle (origin), axis along Z. A bright spoke bar across each
// face makes the spin (and steer) unmistakable while driving.
export function createCarWheel(): CarModelBuffers {
	const a = newArrays();

	const tireColor: [number, number, number] = [18, 18, 20];    // near-black rubber
	const hubColor: [number, number, number] = [85, 85, 92];     // grey hub face
	const spokeColor: [number, number, number] = [205, 205, 212]; // bright marker — shows rotation

	addWheelCylinder(a, WheelRadius, WheelWidth / 2, 16, tireColor, hubColor);

	// A spoke bar on each outer hub face (spans the diameter, thin) — rotates with the wheel.
	for (const z of [-(WheelWidth / 2 + 0.012), WheelWidth / 2 + 0.012]) {
		addBox(a, 0, 0, z, WheelRadius * 1.5, 0.08, 0.03, spokeColor);
	}

	return finalize(a, new AABB3D(
		new Vec3(-WheelRadius, -WheelRadius, -WheelWidth / 2),
		new Vec3(WheelRadius, WheelRadius, WheelWidth / 2)
	));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// Strata Increment 4 Step B — THROWAWAY GLB FIT-CHECK HARNESS.
//
// Merges every primitive of the dropped car GLB ('carGLB' resource) into ONE CarModelBuffers, baking
// each node's full world matrix (the GLB has a Sketchfab Z-up->Y-up root + per-wheel node transforms)
// and its material's baseColorFactor -> vertex color. This renders the whole car as a single static
// body mesh through the EXISTING Car body path (no wheel split / no animation yet) so we can judge
// scale / orientation / looks before investing in the multi-mesh rig. Not in the PR; the procedural
// box (createCarBody/createCarWheel) stays the fallback + default.
//
// EYEBALL KNOBS (one line each) — tweak these, recompile, hard-reload to dial in the fit:
const GlbTargetLength = 4.9;  // meters: scales the model so its longest horizontal axis = this
const GlbExtraYawDeg = 0;     // extra spin about up (deg) if the nose ends up sideways/backwards
const GlbFlip = false;        // true = add 180° (nose points the other way)
const GlbYOffsetM = 0;        // raise (+) / lower (-) after wheels are seated at y = 0
const GlbAutoAlignLongAxisToX = true; // rotate the longer horizontal axis onto +X (our nose axis)

function resolve<T>(coll: T[], v: T | number): T {
	return typeof v === 'number' ? coll[v] : v;
}

function quatToMat4(q: number[]): Mat4 {
	const [x, y, z, w] = q;
	const m = Mat4.identity();
	const v = m.values; // column-major
	v[0] = 1 - 2 * (y * y + z * z); v[1] = 2 * (x * y + z * w);     v[2] = 2 * (x * z - y * w);
	v[4] = 2 * (x * y - z * w);     v[5] = 1 - 2 * (x * x + z * z); v[6] = 2 * (y * z + x * w);
	v[8] = 2 * (x * z + y * w);     v[9] = 2 * (y * z - x * w);     v[10] = 1 - 2 * (x * x + y * y);
	return m;
}

function nodeLocalMatrix(node: any): Mat4 {
	if (node.matrix) {
		return new Mat4(new Float64Array(node.matrix));
	}

	let mat = Mat4.identity();
	if (node.translation) mat = Mat4.translate(mat, node.translation[0], node.translation[1], node.translation[2]);
	if (node.rotation) mat = Mat4.multiply(mat, quatToMat4(node.rotation));
	if (node.scale) mat = Mat4.scale(mat, node.scale[0], node.scale[1], node.scale[2]);
	return mat;
}

// Transform a direction by a matrix's upper 3x3 (column-major), then renormalize.
function transformNormal(m: Float64Array, nx: number, ny: number, nz: number): [number, number, number] {
	const x = m[0] * nx + m[4] * ny + m[8] * nz;
	const y = m[1] * nx + m[5] * ny + m[9] * nz;
	const z = m[2] * nx + m[6] * ny + m[10] * nz;
	const len = Math.hypot(x, y, z) || 1;
	return [x / len, y / len, z / len];
}

function toByte(linear: number): number {
	const c = Math.max(0, Math.min(1, linear));
	return Math.round(Math.pow(c, 1 / 2.2) * 255); // linear -> approx sRGB so it isn't muddy
}

function materialColor(gltf: any, material: any): [number, number, number] {
	const mat = material == null ? null : resolve(gltf.materials ?? [], material);
	const f = mat?.pbrMetallicRoughness?.baseColorFactor;
	if (f) return [toByte(f[0]), toByte(f[1]), toByte(f[2])];
	return [150, 150, 150]; // textured / untyped parts -> flat grey (fine for the fit check)
}

// One baked primitive in the final car frame (positions/normals/colors flat, 0-based indices).
interface RawPrim {
	positions: number[];
	normals: number[];
	colors: number[];
	indices: number[];
}

// A wheel part: its geometry recentered on its own axle (origin) + the mount point it sits at.
export interface GLBWheelPart {
	buffers: CarModelBuffers;
	mountX: number; // front(+)/rear(-) in the car frame
	mountY: number; // axle height above the ground
	mountZ: number; // lateral
	front: boolean;
}

export interface GLBCarParts {
	body: CarModelBuffers;
	wheels: GLBWheelPart[]; // fixed order [FL, FR, RL, RR]
	wheelRadius: number;
}

function primStats(p: RawPrim): {cx: number; cy: number; cz: number; sx: number; sy: number; sz: number} {
	let minx = Infinity, miny = Infinity, minz = Infinity;
	let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
	for (let i = 0; i < p.positions.length; i += 3) {
		minx = Math.min(minx, p.positions[i]);     maxx = Math.max(maxx, p.positions[i]);
		miny = Math.min(miny, p.positions[i + 1]); maxy = Math.max(maxy, p.positions[i + 1]);
		minz = Math.min(minz, p.positions[i + 2]); maxz = Math.max(maxz, p.positions[i + 2]);
	}
	return {
		cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, cz: (minz + maxz) / 2,
		sx: maxx - minx, sy: maxy - miny, sz: maxz - minz
	};
}

// Merge a list of baked primitives into one CarModelBuffers, optionally subtracting an offset
// (used to recenter a wheel group on its axle).
function mergePrims(list: RawPrim[], ox = 0, oy = 0, oz = 0): CarModelBuffers {
	const P: number[] = [], N: number[] = [], C: number[] = [], I: number[] = [];
	let minx = Infinity, miny = Infinity, minz = Infinity;
	let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;

	for (const p of list) {
		const base = P.length / 3;
		for (let i = 0; i < p.positions.length; i += 3) {
			const x = p.positions[i] - ox, y = p.positions[i + 1] - oy, z = p.positions[i + 2] - oz;
			P.push(x, y, z);
			N.push(p.normals[i], p.normals[i + 1], p.normals[i + 2]);
			C.push(p.colors[i], p.colors[i + 1], p.colors[i + 2]);
			minx = Math.min(minx, x); maxx = Math.max(maxx, x);
			miny = Math.min(miny, y); maxy = Math.max(maxy, y);
			minz = Math.min(minz, z); maxz = Math.max(maxz, z);
		}
		for (const k of p.indices) I.push(base + k);
	}

	return {
		position: new Float32Array(P),
		normal: new Float32Array(N),
		color: new Uint8Array(C),
		indices: new Uint32Array(I),
		boundingBox: new AABB3D(new Vec3(minx, miny, minz), new Vec3(maxx, maxy, maxz))
	};
}

// Splits the dropped GLB into a body mesh + 4 axle-centered wheel meshes (so the existing rig can
// spin / steer / suspend them). Bakes node world matrices + baseColorFactor, auto-orients/scales
// into our car frame (nose +X, up +Y), then classifies wheels SPATIALLY (compact, low, corner
// clusters) — material names in this model are unreliable. Wheels returned in order [FL, FR, RL, RR].
export function createCarPartsFromGLB(): GLBCarParts {
	const gltf = ResourceLoader.get('carGLB');
	if (!gltf) throw new Error('carGLB resource not loaded');

	// 1) Walk the scene graph; bake each node's WORLD matrix into per-primitive arrays.
	const prims: RawPrim[] = [];
	const scene = gltf.scene != null ? resolve(gltf.scenes, gltf.scene) : gltf.scenes[0];

	const walk = (node: any, parentWorld: Mat4): void => {
		const world = Mat4.multiply(parentWorld, nodeLocalMatrix(node));

		if (node.mesh != null) {
			const mesh = resolve(gltf.meshes, node.mesh);
			const wv = world.values;

			for (const prim of mesh.primitives) {
				const pos = prim.attributes.POSITION?.value as Float32Array;
				if (!pos) continue;
				const nor = prim.attributes.NORMAL?.value as Float32Array | undefined;
				const idx = prim.indices?.value as (Uint16Array | Uint32Array) | undefined;
				const [cr, cg, cb] = materialColor(gltf, prim.material);
				const rp: RawPrim = {positions: [], normals: [], colors: [], indices: []};

				for (let i = 0; i < pos.length; i += 3) {
					const p = Vec3.applyMatrix4(new Vec3(pos[i], pos[i + 1], pos[i + 2]), world);
					rp.positions.push(p.x, p.y, p.z);

					if (nor) {
						const [nx, ny, nz] = transformNormal(wv, nor[i], nor[i + 1], nor[i + 2]);
						rp.normals.push(nx, ny, nz);
					} else {
						rp.normals.push(0, 1, 0);
					}

					rp.colors.push(cr, cg, cb);
				}

				if (idx) {
					for (let i = 0; i < idx.length; i++) rp.indices.push(idx[i]);
				} else {
					const count = pos.length / 3;
					for (let i = 0; i < count; i++) rp.indices.push(i);
				}

				prims.push(rp);
			}
		}

		for (const child of node.children ?? []) {
			walk(resolve(gltf.nodes, child), world);
		}
	};

	for (const root of scene.nodes) {
		walk(resolve(gltf.nodes, root), Mat4.identity());
	}

	// 2) Global bbox -> auto-orient (long axis to +X) + scale into our car frame.
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (const p of prims) for (let i = 0; i < p.positions.length; i += 3) {
		minX = Math.min(minX, p.positions[i]);     maxX = Math.max(maxX, p.positions[i]);
		minY = Math.min(minY, p.positions[i + 1]); maxY = Math.max(maxY, p.positions[i + 1]);
		minZ = Math.min(minZ, p.positions[i + 2]); maxZ = Math.max(maxZ, p.positions[i + 2]);
	}
	const sizeX = maxX - minX, sizeZ = maxZ - minZ;

	let yawDeg = GlbExtraYawDeg + (GlbFlip ? 180 : 0);
	if (GlbAutoAlignLongAxisToX && sizeZ > sizeX) yawDeg += 90;
	const yaw = yawDeg * Math.PI / 180;
	const scale = GlbTargetLength / Math.max(sizeX, sizeZ);

	const rv = Mat4.yRotation(yaw).values;
	for (const p of prims) for (let i = 0; i < p.positions.length; i += 3) {
		const x = p.positions[i], y = p.positions[i + 1], z = p.positions[i + 2];
		p.positions[i] = (rv[0] * x + rv[4] * y + rv[8] * z) * scale;
		p.positions[i + 1] = (rv[1] * x + rv[5] * y + rv[9] * z) * scale;
		p.positions[i + 2] = (rv[2] * x + rv[6] * y + rv[10] * z) * scale;

		const nx = p.normals[i], ny = p.normals[i + 1], nz = p.normals[i + 2];
		p.normals[i] = rv[0] * nx + rv[4] * ny + rv[8] * nz;
		p.normals[i + 1] = rv[1] * nx + rv[5] * ny + rv[9] * nz;
		p.normals[i + 2] = rv[2] * nx + rv[6] * ny + rv[10] * nz;
	}

	// 3) Recompute bbox after rotate/scale and recenter X/Z + seat the model on y = 0.
	minX = minY = minZ = Infinity; maxX = maxY = maxZ = -Infinity;
	for (const p of prims) for (let i = 0; i < p.positions.length; i += 3) {
		minX = Math.min(minX, p.positions[i]);     maxX = Math.max(maxX, p.positions[i]);
		minY = Math.min(minY, p.positions[i + 1]); maxY = Math.max(maxY, p.positions[i + 1]);
		minZ = Math.min(minZ, p.positions[i + 2]); maxZ = Math.max(maxZ, p.positions[i + 2]);
	}
	const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
	const dy = -minY + GlbYOffsetM;
	for (const p of prims) for (let i = 0; i < p.positions.length; i += 3) {
		p.positions[i] -= cx;
		p.positions[i + 1] += dy;
		p.positions[i + 2] -= cz;
	}

	// 4) Classify each primitive. A wheel part is a ROUND disc (sx ~= sy in the X/Y plane), of TIRE
	// WIDTH along the lateral Z axis, LOW, and at a CORNER. This isolates the tire+rim discs and
	// rejects the dense exhaust/sill junk pieces near the corners (which dragged the axle off before).
	const carH = (maxY - minY);
	const halfL = (maxX - minX) / 2, halfW = (maxZ - minZ) / 2;
	const bodyPrims: RawPrim[] = [];
	const wheelGroups: RawPrim[][] = [[], [], [], []]; // FL, FR, RL, RR

	for (const p of prims) {
		const s = primStats(p);
		const diameter = Math.max(s.sx, s.sy);
		const round = Math.abs(s.sx - s.sy) / Math.max(s.sx, s.sy, 1e-6) < 0.45;
		const tireWidth = s.sz > 0.12 && s.sz < 0.5; // wheel thickness (not a thin plate, not a panel)
		const low = s.cy < 0.45 * carH;
		const corner = Math.abs(s.cx) > 0.45 * halfL && Math.abs(s.cz) > 0.5 * halfW;
		const wheelSized = diameter > 0.4 && diameter < 1.1;

		if (round && tireWidth && low && corner && wheelSized) {
			const idx = (s.cx > 0 ? 0 : 2) + (s.cz > 0 ? 0 : 1); // FL=0,FR=1,RL=2,RR=3
			wheelGroups[idx].push(p);
		} else {
			bodyPrims.push(p);
		}
	}

	// 5) Build the body + each axle-centered wheel.
	const body = mergePrims(bodyPrims);
	const wheels: GLBWheelPart[] = [];
	let wheelRadius = WheelRadius;

	for (let g = 0; g < 4; g++) {
		const group = wheelGroups[g];
		if (group.length === 0) continue; // a missed corner just won't draw (better than crashing)

		// Combined center of the group = the axle/mount point.
		let wminx = Infinity, wminy = Infinity, wminz = Infinity;
		let wmaxx = -Infinity, wmaxy = -Infinity, wmaxz = -Infinity;
		for (const p of group) for (let i = 0; i < p.positions.length; i += 3) {
			wminx = Math.min(wminx, p.positions[i]);     wmaxx = Math.max(wmaxx, p.positions[i]);
			wminy = Math.min(wminy, p.positions[i + 1]); wmaxy = Math.max(wmaxy, p.positions[i + 1]);
			wminz = Math.min(wminz, p.positions[i + 2]); wmaxz = Math.max(wmaxz, p.positions[i + 2]);
		}
		const mx = (wminx + wmaxx) / 2, my = (wminy + wmaxy) / 2, mz = (wminz + wmaxz) / 2;
		wheelRadius = Math.max((wmaxx - wminx), (wmaxy - wminy)) / 2; // disc radius (X/Y plane)

		wheels[g] = {
			buffers: mergePrims(group, mx, my, mz),
			mountX: mx, mountY: my, mountZ: mz,
			front: mx > 0
		};
	}

	console.log(`[Strata] createCarPartsFromGLB: body ${body.position.length / 3} verts, ` +
		`wheels ${wheelGroups.map(g => g.length)} prims, scale ${scale.toFixed(3)}, yaw ${yawDeg}°, ` +
		`wheelRadius ${wheelRadius.toFixed(3)}, mounts ` +
		wheels.map(w => w ? `(${w.mountX.toFixed(2)},${w.mountY.toFixed(2)},${w.mountZ.toFixed(2)})` : 'MISSING').join(' '));

	return {body, wheels, wheelRadius};
}
