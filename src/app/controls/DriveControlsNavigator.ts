import ControlsNavigator from "./ControlsNavigator";
import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import {ControlsState} from "../systems/ControlsSystem";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import TerrainHeightProvider from "~/app/terrain/TerrainHeightProvider";
import {CarWheelOffsetX, CarWheelOffsetZ, WheelRadius} from "~/app/objects/models/CarModel";

// Strata Phase 2, Step 1 — THROWAWAY PROTOTYPE GLUE.
// A logical arcade car pose (x, z, heading, speed) driven with WASD that rides the
// terrain-height field, plus a low chase camera. No moat code lives here; this whole
// file is disposable and renderer-specific (it talks to Streets GL's camera directly).

const MaxSpeed = 35.76; // m/s (~80 mph)
const BoostMaxSpeed = 102.82; // m/s (~230 mph) — hold Shift for a nitrous-style boost
const MaxReverseSpeed = 9; // m/s
const Acceleration = 16; // m/s^2
const BoostAcceleration = 62; // m/s^2 while boosting
const BrakeDeceleration = 32; // m/s^2 — the S key (brakes, then eases into reverse)
const FootBrakeDeceleration = 30; // m/s^2 — Space: dedicated foot brake, eases down to a stop, never reverses
const FootBrakeRampRate = 5; // 1/s — how fast the foot-brake axis eases IN (lower = more gradual bite)
const FootBrakeReleaseRate = 16; // 1/s — how fast the foot-brake axis eases OUT (high = the car launches promptly when you lift off Space)
const DonutSpinRate = 1.4; // rad/s — heading spin when holding W + Space + steer (donuts / spin in place)
const DonutStoppedThreshold = 0.5; // m/s — donuts only engage when the car is essentially STOPPED (no rolling donuts)
const DonutWheelSpinRate = 40; // rad/s — REAR-wheel burnout spin while stopped under throttle (kept < MaxVisualSpinRate so it doesn't strobe)
const BurnoutSpinEase = 3.5; // 1/s — how fast the rear burnout spin eases in/out; on launch it spins DOWN into traction instead of stopping dead
const Friction = 6; // passive drag toward zero, m/s^2
const SteerRate = 1.7; // rad/s at full lock
const SteerSpeedFalloff = 6; // speed (m/s) at which steering reaches full authority

// Analog input ramps — the keys ease into smooth [0..1] / [-1..1] axes instead of snapping
// on/off. These are the SAME axes a gamepad will feed directly later (added Strata-side).
const ThrottleRampRate = 3; // 1/s — how fast the throttle axis eases in toward full
const BrakeRampRate = 5;    // 1/s
const SteerRampRate = 4;    // 1/s — toward the held steer direction
const SteerReturnRate = 7;  // 1/s — back to center on release (quicker than ramp-in)

const MaxTilt = MathUtils.toRad(22); // clamp pitch/roll so a stray terrain sample can't flip the car

// Wheel animation (visual only — driven from data we already compute each frame).
const MaxSuspensionDroop = 0.22;    // m a wheel can reach DOWN to lower ground (chassis rides above)
const MaxSuspensionCompress = 0.12; // m a wheel can rise into a bump
const RideHeightClearance = 0.02;   // m of clearance kept between the terrain and the chassis (small = body sits ON the wheels)
const MaxChassisLift = 0.5;         // m cap on the convex-slope chassis raise (guards a bad sample)
const MaxVisualSteer = MathUtils.toRad(-30); // front-wheel visual turn at full lock (sign = A/D direction)
const VisualSteerRate = 8; // how fast the visual steer eases toward its target (1/s)
const WheelSpinSign = -1; // flip to -1 if the wheels visibly roll backwards while driving forward
const MaxVisualSpinRate = 45; // rad/s — cap on visual wheel angular velocity so fast spin doesn't strobe/flicker (defeats TAA)

// Spring-damper body suspension (Phase 3 feel pass). The car still rides the terrain — NO gravity
// here (vertical dynamics / airtime live on the Strata branch). The WHEELS sit on the terrain
// exactly; the BODY chases the terrain pose (+ weight-transfer lean) through a damped spring, so
// jagged terrain reads as a smooth suspension bounce and the body dives/squats/rolls with the car.
const SuspensionFreq = 15;      // rad/s — natural frequency of the body spring (higher = snappier/tighter)
const SuspensionDamping = 0.9;  // damping ratio (1 = critical / no overshoot; <1 = a little settle)
const PitchGainLong = 0.0008;   // rad of body pitch per m/s^2 of forward accel (squat / dive)
const RollGainLat = 0.0016;     // rad of body roll per m/s^2 of lateral accel (corner lean; flip sign if it leans the wrong way)
const MaxWeightTransferTilt = MathUtils.toRad(1.5); // clamp the weight-transfer pitch/roll contribution (keeps brake dive subtle)
const AccelSmoothing = 8;       // 1/s low-pass on the measured accelerations (kills per-frame spikes)
const MaxBodyHeave = 0.05;      // m the sprung body may travel vertically off the wheels (suspension travel)
const MaxBodyTiltDev = MathUtils.toRad(5); // max the body may pitch/roll away from the wheel plane
const BoostLeanBack = MathUtils.toRad(2.5); // extra nose-up the body holds while boosting (shows the speed)

// Chase camera — defaults plus mouse-adjustable range.
const DefaultCameraDistance = 17; // m behind the car
const MinCameraDistance = 6;
const MaxCameraDistance = 200; // m — how far the scroll wheel can zoom the chase cam out
const DefaultCameraPitch = MathUtils.toRad(20); // downward tilt of the chase cam
const MinCameraPitch = MathUtils.toRad(3); // hard floor on the manual tilt so the chase cam can't drop under the map
const MaxCameraPitch = MathUtils.toRad(80);
const HoodLookLimit = MathUtils.toRad(35); // how far the first-person hood cam can look up/down (mouse)
const OrbitSensitivity = 0.004; // rad per pixel of mouse drag
const ZoomSensitivity = 0.02; // distance units per wheel delta
const ZoomSmoothing = 10; // 1/s — how fast the zoom eases toward the scrolled target (higher = snappier)
const CameraGroundClearance = 0.6; // m — minimum the chase-cam eye is kept above the terrain BELOW it (small, so it only kicks in on real downhill slopes, not flat ground — keeps the low cams low)
const LookAheadFadePitch = MathUtils.toRad(45); // above this down-tilt the look-ahead has faded out, so tilting the cam down frames the CAR (old-GTA roof view) instead of aiming past it

// Preset cameras (cycle with V), Forza/GT7-style. `chase` looks at the car from behind (distance +
// down-tilt + eye height); `hood` is a first-person cam at the nose looking forward. Manual scroll-zoom
// and drag/mouse-look still adjust from a preset. Index 0 = default.
interface CameraPreset {
	mode: 'chase' | 'hood';
	distance: number;  // chase: m behind the car (ignored for hood)
	pitch: number;     // chase: down-tilt of the EYE position; hood: default forward-look down-tilt
	height: number;    // m the eye sits above the car
	forward: number;   // hood: m forward from car center to the eye (ignored for chase)
	lookAhead: number; // chase: m AHEAD of the car the cam aims (>0 lifts the horizon so you see the road ahead, Forza/GT7-style; 0 = look straight at the car)
	lookUp: number;    // chase: m ABOVE the car height the cam aims (tilts the view up)
	smoothing: number; // chase: 1/s easing of the cam position + aim toward ideal (0 = rigid/snappy; >0 = a natural lagging follow). Lower = floatier.
}
const ChaseCameraPresets: CameraPreset[] = [
	// SINGLE active camera (user pick, 2026-06-22) — a clean classic chase that looks straight at the
	// car (no look-ahead fade, no smoothing lag). Kept as the ONLY entry for simpler UX, so V has
	// nothing to cycle to. The variants below are PRESERVED (not deleted) for later — uncomment any to
	// bring back the V cycle (e.g. add a hood or a zoomed-in cam).
	{mode: 'chase', distance: 16, pitch: MathUtils.toRad(12), height: 2.2, forward: 0, lookAhead: 0,  lookUp: 0,   smoothing: 0}, // Standard — the keeper
	// {mode: 'chase', distance: 15, pitch: MathUtils.toRad(13), height: 2.6, forward: 0, lookAhead: 0,  lookUp: 0,   smoothing: 6}, // Smooth — natural lagging follow
	// {mode: 'chase', distance: 11, pitch: MathUtils.toRad(5),  height: 1.4, forward: 0, lookAhead: 14, lookUp: 1.8, smoothing: 0}, // Low — Forza-style: low + aimed ahead/up
	// {mode: 'chase', distance: 8,  pitch: MathUtils.toRad(4),  height: 1.2, forward: 0, lookAhead: 12, lookUp: 1.6, smoothing: 0}, // Close — lowest, hugged in behind, aimed ahead/up
	// {mode: 'hood',  distance: 0,  pitch: MathUtils.toRad(-5), height: 0.95, forward: 2.3, lookAhead: 0, lookUp: 0, smoothing: 0}, // Hood — first-person, looking slightly up (render path intact)
];

// Speed-based FOV punch (toggle with F). Widens the view as the car gets faster to sell speed.
const FovSpeedGainDeg = 16; // extra vertical FOV (deg) added at boost top speed
const FovSmoothing = 4; // 1/s — easing of the FOV effect in/out

// Move `current` toward `target` by at most rate*dt (a framerate-independent linear approach).
function approach(current: number, target: number, rate: number, dt: number): number {
	const step = rate * dt;
	if (current < target) return Math.min(current + step, target);
	if (current > target) return Math.max(current - step, target);
	return target;
}

export default class DriveControlsNavigator extends ControlsNavigator {
	private readonly camera: PerspectiveCamera;
	private readonly terrainHeightProvider: TerrainHeightProvider;

	private x: number = 0;
	private z: number = 0;
	private y: number = 0;
	private heading: number = 0;
	private speed: number = 0;
	private pitch: number = 0; // ground pose, nose up/down (front-vs-rear terrain) — WHEELS ride this
	private roll: number = 0;  // ground pose, bank (left-vs-right terrain) — WHEELS ride this
	private bodyPitch: number = 0; // = pitch + sprung weight-transfer dive/squat — BODY mesh only
	private bodyRoll: number = 0;  // = roll + sprung weight-transfer corner lean — BODY mesh only

	// Wheel animation state (visual). suspension is per-wheel vertical travel in [FL, FR, RL, RR]
	// order (matches CarWheelMounts) — the residual of each wheel's ground vs the body tilt plane.
	private wheelSpin: number = 0;     // front-wheel roll (also the rear baseline) — distance / radius
	private rearWheelSpin: number = 0; // rear-wheel roll = base roll + the burnout excess (rears only)
	private burnoutExcessRate: number = 0; // extra rear angular velocity from a burnout; eased so it spins DOWN into traction
	private steerAngle: number = 0;
	private suspension: number[] = [0, 0, 0, 0];

	// Analog input axes, ramped from the keys each frame (a gamepad will set these directly
	// later). throttle/brake in [0,1], steer in [-1,1].
	private throttleInput: number = 0;
	private brakeInput: number = 0;
	private steerInput: number = 0;

	// Suspension state. yTerrain/pitchTerrain/rollTerrain are the raw terrain targets (from
	// sampleGroundHeight); the WHEELS sit on those exactly (planted, no clipping). The sprung BODY
	// (bodyY/bodyPitch/bodyRoll + their velocities) chases those targets — plus the weight-transfer
	// lean — through a damped spring, so jagged terrain reads as a smooth suspension bounce and the
	// body travels a little relative to the wheels. The smoothed accelerations feed the lean.
	private yTerrain: number = 0;
	private pitchTerrain: number = 0;
	private rollTerrain: number = 0;
	private bodyY: number = 0;
	private bodyYVel: number = 0;
	private bodyPitchVel: number = 0;
	private bodyRollVel: number = 0;
	private smoothedLongAccel: number = 0;
	private smoothedLatAccel: number = 0;
	private prevSpeed: number = 0;
	private prevHeading: number = 0;

	private camDistance: number = DefaultCameraDistance;
	private camDistanceTarget: number = DefaultCameraDistance; // scroll sets this; camDistance eases toward it
	private cameraPresetIndex: number = 0; // index into ChaseCameraPresets (cycle with V)
	private currentPreset: CameraPreset = ChaseCameraPresets[0];
	private isHoodCam: boolean = false; // current preset is the first-person hood cam
	private camPitch: number = DefaultCameraPitch;
	private camYawOffset: number = 0;
	// Smoothed (lagging) camera state for presets with smoothing > 0 — the eye + aim ease toward their
	// ideal each frame. camSmoothInit is cleared on entry / preset switch so it snaps before easing.
	private smoothedCamEye: Vec3 = new Vec3();
	private smoothedCamLookAt: Vec3 = new Vec3();
	private camSmoothInit: boolean = false;
	private isOrbiting: boolean = false;
	private isMouseLook: boolean = false; // pointer-locked free mouse-look (toggle with C)
	private fovEffectEnabled: boolean = true; // speed-based FOV punch (toggle with F)
	private baseFov: number = 0; // the camera's FOV at drive-mode entry, restored on exit
	private fovExtra: number = 0; // current eased FOV addition from speed

	private accelKeyPressed: boolean = false;
	private brakeKeyPressed: boolean = false;
	private footBrakeKeyPressed: boolean = false; // Space — dedicated foot brake (no reverse)
	private footBrakeInput: number = 0;
	private steerLeftKeyPressed: boolean = false;
	private steerRightKeyPressed: boolean = false;
	private boostKeyPressed: boolean = false;

	public constructor(
		element: HTMLElement,
		camera: PerspectiveCamera,
		terrainHeightProvider: TerrainHeightProvider
	) {
		super(element);

		this.camera = camera;
		this.terrainHeightProvider = terrainHeightProvider;

		document.addEventListener('keydown', (e: KeyboardEvent) => this.keyDownEvent(e));
		document.addEventListener('keyup', (e: KeyboardEvent) => this.keyUpEvent(e));
		this.element.addEventListener('mousedown', (e: MouseEvent) => this.mouseDownEvent(e));
		this.element.addEventListener('mouseup', (e: MouseEvent) => this.mouseUpEvent(e));
		this.element.addEventListener('mouseleave', () => this.mouseLeaveEvent());
		this.element.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveEvent(e));
		this.element.addEventListener('wheel', (e: WheelEvent) => this.wheelEvent(e));

		// Track pointer-lock state so mouse-look turns off when the browser releases it (e.g. Esc).
		document.addEventListener('pointerlockchange', () => {
			this.isMouseLook = document.pointerLockElement === this.element;
		});

		this.applyCameraPreset(0);
	}

	// Called by ControlsSystem right before enable() to spawn the car at the current view.
	public setCarPose(x: number, z: number, heading: number): void {
		this.x = x;
		this.z = z;
		this.heading = heading;
		this.speed = 0;
		this.sampleGroundHeight();

		// Settle the suspension at the spawn pose so there's no spring bounce on entry.
		this.y = this.bodyY = this.yTerrain;
		this.pitch = this.bodyPitch = this.pitchTerrain;
		this.roll = this.bodyRoll = this.rollTerrain;
		this.bodyYVel = this.bodyPitchVel = this.bodyRollVel = 0;
		this.smoothedLongAccel = this.smoothedLatAccel = 0;
		this.prevSpeed = this.speed;
		this.prevHeading = this.heading;
	}

	public getCarPose(): {
		x: number; y: number; z: number; heading: number; pitch: number; roll: number;
		bodyY: number; bodyPitch: number; bodyRoll: number;
		wheelSpin: number; rearWheelSpin: number; steerAngle: number; suspension: number[];
	} {
		return {
			x: this.x, y: this.y, z: this.z, heading: this.heading, pitch: this.pitch, roll: this.roll,
			bodyY: this.bodyY, bodyPitch: this.bodyPitch, bodyRoll: this.bodyRoll,
			wheelSpin: this.wheelSpin, rearWheelSpin: this.rearWheelSpin,
			steerAngle: this.steerAngle, suspension: this.suspension
		};
	}

	public getSpeed(): number {
		return this.speed;
	}

	// World-space yaw the chase camera faces along (same convention as GroundControlsNavigator.yaw,
	// both feed polarToCartesian). Used to drive the compass while in drive mode.
	public getCameraYaw(): number {
		return this.heading + this.camYawOffset;
	}

	// Snap to a preset camera (recentered behind / facing forward). Manual scroll-zoom and
	// drag/mouse-look still adjust from here.
	private applyCameraPreset(index: number): void {
		const preset = ChaseCameraPresets[index];
		this.currentPreset = preset;
		this.isHoodCam = preset.mode === 'hood';
		this.camPitch = preset.pitch;
		this.camYawOffset = 0;
		this.camSmoothInit = false; // snap to the new preset's framing, then resume easing
		if (preset.mode === 'chase') {
			this.camDistanceTarget = MathUtils.clamp(preset.distance, MinCameraDistance, MaxCameraDistance);
		}
	}

	// Kinematic suspension: sample terrain at the 4 wheel contact points, seat the body on the
	// average, and tilt it to the slope (pitch from front-vs-rear, roll from left-vs-right).
	// The Streets GL terrain is left UNTOUCHED — the car hugs the bumps instead.
	private sampleGroundHeight(): void {
		const cosH = Math.cos(this.heading);
		const sinH = Math.sin(this.heading);

		// Local wheel offsets (nose = +X, lateral = +Z) rotated into world by heading. The
		// lateral basis matches MathUtils.polarToCartesian(heading + PI/2) = (-sin, *, cos).
		const sample = (localX: number, localZ: number): number | null => {
			const wx = this.x + cosH * localX - sinH * localZ;
			const wz = this.z + sinH * localX + cosH * localZ;

			// Returns 0 while terrain fallback is on, null for not-yet-loaded tiles.
			return this.terrainHeightProvider.getHeightGlobalInterpolated(wx, wz, true);
		};

		const fl = sample(CarWheelOffsetX, CarWheelOffsetZ);   // front, local +Z
		const fr = sample(CarWheelOffsetX, -CarWheelOffsetZ);  // front, local -Z
		const rl = sample(-CarWheelOffsetX, CarWheelOffsetZ);  // rear,  local +Z
		const rr = sample(-CarWheelOffsetX, -CarWheelOffsetZ); // rear,  local -Z
		const cc = sample(0, 0);                               // belly point (between the wheels)

		// If any tile isn't loaded yet, keep the last good pose this frame (never snap to 0).
		if (fl === null || fr === null || rl === null || rr === null || cc === null) {
			return;
		}

		const front = (fl + fr) / 2;
		const rear = (rl + rr) / 2;
		const sidePos = (fl + rl) / 2; // local +Z wheels
		const sideNeg = (fr + rr) / 2; // local -Z wheels

		const wheelbase = 2 * CarWheelOffsetX;
		const track = 2 * CarWheelOffsetZ;

		// Body orientation = best-fit tilt plane through the 4 wheel contacts.
		// pitch (zRotate in the car matrix): nose up when the front contacts are higher.
		const pitch = Math.atan2(front - rear, wheelbase);
		// roll (xRotate): the lower-ground side seats lower. Flip to (sidePos - sideNeg) if it
		// banks the wrong way — a one-line tune.
		const roll = Math.atan2(sideNeg - sidePos, track);
		this.pitchTerrain = MathUtils.clamp(pitch, -MaxTilt, MaxTilt);
		this.rollTerrain = MathUtils.clamp(roll, -MaxTilt, MaxTilt);

		// Plane gradients in local X/Z, and the plane height through the 4-wheel average.
		const gx = (front - rear) / wheelbase;  // dHeight / d(localX)
		const gz = (sidePos - sideNeg) / track; // dHeight / d(localZ)
		let yBase = (fl + fr + rl + rr) / 4;
		const planeAt = (lx: number, lz: number): number => yBase + lx * gx + lz * gz;

		// Raise the chassis so NO support point (4 wheels + the belly) pokes above the plane, then
		// add a little ground clearance. This is what stops the body/wheels dipping into convex
		// slopes: the chassis rests on the HIGH point and the lower wheels droop down to reach
		// their own ground — exactly how real suspension behaves cresting a hill.
		const penetration = Math.max(
			0,
			fl - planeAt(CarWheelOffsetX, CarWheelOffsetZ),
			fr - planeAt(CarWheelOffsetX, -CarWheelOffsetZ),
			rl - planeAt(-CarWheelOffsetX, CarWheelOffsetZ),
			rr - planeAt(-CarWheelOffsetX, -CarWheelOffsetZ),
			cc - planeAt(0, 0)
		);
		yBase += Math.min(penetration, MaxChassisLift) + RideHeightClearance;
		this.yTerrain = yBase;

		// Per-wheel suspension travel = each wheel's actual ground minus the (now raised) plane at
		// that wheel — mostly DROOP, so the tires reach back down to the ground while the body
		// rides above it. Lots of droop allowed, less compression into a bump.
		const residual = (g: number, lx: number, lz: number): number =>
			MathUtils.clamp(g - planeAt(lx, lz), -MaxSuspensionDroop, MaxSuspensionCompress);

		this.suspension[0] = residual(fl, CarWheelOffsetX, CarWheelOffsetZ);   // FL
		this.suspension[1] = residual(fr, CarWheelOffsetX, -CarWheelOffsetZ);  // FR
		this.suspension[2] = residual(rl, -CarWheelOffsetX, CarWheelOffsetZ);  // RL
		this.suspension[3] = residual(rr, -CarWheelOffsetX, -CarWheelOffsetZ); // RR
	}

	private keyDownEvent(e: KeyboardEvent): void {
		if (!this.isEnabled || !this.isInFocus || e.ctrlKey || e.metaKey || e.altKey) {
			return;
		}

		switch (e.code) {
			case 'KeyW':
				this.accelKeyPressed = true;
				break;
			case 'KeyS':
				this.brakeKeyPressed = true;
				break;
			case 'Space':
				e.preventDefault();
				this.footBrakeKeyPressed = true;
				break;
			case 'KeyA':
				this.steerLeftKeyPressed = true;
				break;
			case 'KeyD':
				this.steerRightKeyPressed = true;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.boostKeyPressed = true;
				break;
			case 'KeyC':
				// Toggle pointer-locked free mouse-look. Esc (browser default) or C again releases it.
				if (document.pointerLockElement === this.element) {
					document.exitPointerLock();
				} else {
					this.element.requestPointerLock();
				}
				break;
			case 'KeyF':
				// Toggle the speed-based FOV punch.
				this.fovEffectEnabled = !this.fovEffectEnabled;
				break;
			case 'KeyV':
				// Cycle the preset chase cameras (Standard → Close → Far → …).
				this.cameraPresetIndex = (this.cameraPresetIndex + 1) % ChaseCameraPresets.length;
				this.applyCameraPreset(this.cameraPresetIndex);
				break;
		}
	}

	private keyUpEvent(e: KeyboardEvent): void {
		switch (e.code) {
			case 'KeyW':
				this.accelKeyPressed = false;
				break;
			case 'KeyS':
				this.brakeKeyPressed = false;
				break;
			case 'Space':
				this.footBrakeKeyPressed = false;
				break;
			case 'KeyA':
				this.steerLeftKeyPressed = false;
				break;
			case 'KeyD':
				this.steerRightKeyPressed = false;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.boostKeyPressed = false;
				break;
		}
	}

	private mouseDownEvent(e: MouseEvent): void {
		if (!this.isEnabled) {
			return;
		}

		if (e.button === 0 || e.button === 2) {
			e.preventDefault();
			this.isOrbiting = true;
		}
	}

	private mouseUpEvent(e: MouseEvent): void {
		if (e.button === 0 || e.button === 2) {
			this.isOrbiting = false;
		}
	}

	private mouseLeaveEvent(): void {
		this.isOrbiting = false;
	}

	private mouseMoveEvent(e: MouseEvent): void {
		// Orbit while dragging (button held) OR while pointer-locked mouse-look is on.
		if (!this.isEnabled || (!this.isOrbiting && !this.isMouseLook)) {
			return;
		}

		// Orbit (chase) or turn the head (hood): horizontal = swing, vertical = pitch.
		this.camYawOffset += e.movementX * OrbitSensitivity;
		const minPitch = this.isHoodCam ? -HoodLookLimit : MinCameraPitch;
		const maxPitch = this.isHoodCam ? HoodLookLimit : MaxCameraPitch;
		this.camPitch = MathUtils.clamp(this.camPitch + e.movementY * OrbitSensitivity, minPitch, maxPitch);
	}

	private wheelEvent(e: WheelEvent): void {
		if (!this.isEnabled) {
			return;
		}

		e.preventDefault();

		// Scroll nudges a target distance; camDistance eases toward it in updateCamera for a smooth zoom.
		this.camDistanceTarget = MathUtils.clamp(
			this.camDistanceTarget + e.deltaY * ZoomSensitivity,
			MinCameraDistance,
			MaxCameraDistance
		);
	}

	private updateMovement(deltaTime: number): void {
		// Ramp the raw key states into smooth analog axes. Tapping a key no longer snaps to full
		// throttle/lock — it eases in, and steering self-centers on release. These are the SAME
		// axes a gamepad will drive later, so the feel transfers straight to a controller.
		const throttleTarget = this.accelKeyPressed ? 1 : 0;
		const brakeTarget = this.brakeKeyPressed ? 1 : 0;
		const steerTarget = (this.steerRightKeyPressed ? 1 : 0) - (this.steerLeftKeyPressed ? 1 : 0);

		this.throttleInput = approach(this.throttleInput, throttleTarget, ThrottleRampRate, deltaTime);
		this.brakeInput = approach(this.brakeInput, brakeTarget, BrakeRampRate, deltaTime);
		if (!this.footBrakeKeyPressed && this.accelKeyPressed) {
			// Gas held and the brake just released = clearly a launch: drop the foot brake immediately
			// so the car pulls away NOW instead of waiting for the analog brake to ease out.
			this.footBrakeInput = 0;
		} else {
			this.footBrakeInput = approach(
				this.footBrakeInput, this.footBrakeKeyPressed ? 1 : 0,
				this.footBrakeKeyPressed ? FootBrakeRampRate : FootBrakeReleaseRate, deltaTime
			);
		}
		this.steerInput = approach(
			this.steerInput, steerTarget, steerTarget === 0 ? SteerReturnRate : SteerRampRate, deltaTime
		);

		// Hold Shift for a nitrous-style boost (higher top speed + harder acceleration).
		const accel = this.boostKeyPressed ? BoostAcceleration : Acceleration;
		const speedCeiling = this.boostKeyPressed ? BoostMaxSpeed : MaxSpeed;

		if (this.footBrakeInput > 0.001) {
			// Dedicated foot brake (Space): haul the speed toward zero from either direction and
			// STOP at zero — never rolls into reverse. Wins over throttle (brake-and-gas = brake).
			// Strong + analog, so it's good for scrubbing speed before a 90° turn.
			const dv = FootBrakeDeceleration * this.footBrakeInput * deltaTime;
			if (this.speed > dv) {
				this.speed -= dv;
			} else if (this.speed < -dv) {
				this.speed += dv;
			} else {
				this.speed = 0;
			}
		} else if (this.throttleInput > 0.001) {
			if (this.speed < speedCeiling) {
				// Accelerate toward the ceiling, but SETTLE exactly on it — no per-frame
				// overshoot-then-drag oscillation (that made the mph/km-h readout flicker ±1).
				this.speed = Math.min(this.speed + accel * this.throttleInput * deltaTime, speedCeiling);
			} else {
				// Above the current ceiling (e.g. boost just released) — bleed back down to it
				// via drag so it eases off instead of snapping, then holds steady.
				this.speed = Math.max(this.speed - Friction * deltaTime, speedCeiling);
			}
		} else if (this.brakeInput > 0.001) {
			this.speed -= BrakeDeceleration * this.brakeInput * deltaTime;
		} else {
			// Passive drag toward zero.
			const drag = Friction * deltaTime;

			if (this.speed > drag) {
				this.speed -= drag;
			} else if (this.speed < -drag) {
				this.speed += drag;
			} else {
				this.speed = 0;
			}
		}

		// Hard bound stays at the boost ceiling so a released boost coasts down naturally.
		this.speed = MathUtils.clamp(this.speed, -MaxReverseSpeed, BoostMaxSpeed);

		// Steering authority grows with speed; flips with reverse so it steers naturally. The
		// steer axis is analog now, so turn-in and self-centering are smooth (controller-ready).
		if (this.steerInput !== 0 && this.speed !== 0) {
			const speedFactor = MathUtils.clamp(Math.abs(this.speed) / SteerSpeedFalloff, 0, 1);
			const reverseSign = this.speed >= 0 ? 1 : -1;
			this.heading += this.steerInput * SteerRate * speedFactor * reverseSign * deltaTime;
		}

		// Burnout / donuts — only once the car is fully STOPPED (the foot brake has pinned it), so
		// pressing gas + brake together WHILE STILL MOVING does NOT add any rotation or spin (that
		// would make a mid-corner turn unrealistically tight); moving, you just scrub speed and steer
		// normally. There's no handbrake, so this is a stationary spin-in-place, not a rolling drift.
		const fullyStopped = Math.abs(this.speed) < DonutStoppedThreshold;
		// Burnout = throttle held while essentially stopped. The REAR wheels spin in place EVEN WITHOUT
		// steering or the brake (GTA-style: rev against the foot brake, then when you lift off the brake
		// the rears KEEP spinning as the car launches — no momentary stop). It's keyed off |speed| (not
		// the brake key) precisely so the spin carries continuously through the brake-release into the
		// launch; once the car is actually rolling, the speed-based spin below takes over.
		const burnout = this.accelKeyPressed && fullyStopped;
		// A donut additionally needs steering — that's what rotates the heading (spin in place). Holding
		// the foot brake is what KEEPS the car stopped long enough to sustain it; a normal launch crosses
		// the stopped threshold in a frame or two, so this only flickers on then off (no rolling donut).
		const inDonut = burnout && this.footBrakeKeyPressed && this.steerInput !== 0;
		if (inDonut) {
			this.heading += DonutSpinRate * this.throttleInput * Math.sign(this.steerInput) * deltaTime;
		}

		// Visual wheel animation. Spin by distance / radius, but CAP the angular velocity so at high
		// speed the wheels don't spin so far per frame that they strobe / defeat TAA (= the flicker).
		// Below the cap it's exact; above it the wheels hold a clean, fast-but-stable spin.
		const spinRate = WheelSpinSign * this.speed / WheelRadius; // rad/s
		const rollDelta = MathUtils.clamp(spinRate, -MaxVisualSpinRate, MaxVisualSpinRate) * deltaTime;
		this.wheelSpin += rollDelta;
		this.rearWheelSpin += rollDelta; // rear base = front (in sync when just rolling)

		// Burnout excess on the REARS only: ~full while stopped under throttle, eased back toward zero
		// otherwise. Because it EASES (not a hard cutoff), when you lift off the brake the rears spin
		// DOWN into traction as the car launches — they never stop dead or snap to ground speed. The
		// front wheels stay put during a standstill burnout (they only get rollDelta), and just STEER.
		const excessTarget = burnout ? WheelSpinSign * DonutWheelSpinRate * this.throttleInput : 0;
		this.burnoutExcessRate += (excessTarget - this.burnoutExcessRate) * MathUtils.clamp(BurnoutSpinEase * deltaTime, 0, 1);
		this.rearWheelSpin += this.burnoutExcessRate * deltaTime;
		const targetSteer = this.steerInput * MaxVisualSteer;
		this.steerAngle += (targetSteer - this.steerAngle) * MathUtils.clamp(VisualSteerRate * deltaTime, 0, 1);

		// Integrate position along the heading (altitude 0 => horizontal forward in x/z).
		const forward = MathUtils.polarToCartesian(this.heading, 0);
		this.x += forward.x * this.speed * deltaTime;
		this.z += forward.z * this.speed * deltaTime;

		this.sampleGroundHeight();
	}

	// Spring-damper body suspension + weight transfer. The terrain dictates where the wheels sit
	// (this.*Terrain, from sampleGroundHeight); here the body heave/pitch/roll chase those targets
	// through a damped spring so bumps make it settle/bob, and the measured longitudinal/lateral
	// acceleration leans the body (dive/squat/corner roll). No gravity — the car stays grounded;
	// vertical dynamics live on the Strata branch.
	private updateSuspension(deltaTime: number): void {
		const dt = Math.min(deltaTime, 0.05); // clamp so a frame hitch can't blow up the spring

		// Measured accelerations (low-passed to kill per-frame spikes).
		const longAccel = dt > 0 ? (this.speed - this.prevSpeed) / dt : 0;
		let headingDelta = this.heading - this.prevHeading;
		headingDelta = Math.atan2(Math.sin(headingDelta), Math.cos(headingDelta)); // shortest arc
		const yawRate = dt > 0 ? headingDelta / dt : 0;
		const latAccel = this.speed * yawRate;

		const k = MathUtils.clamp(AccelSmoothing * dt, 0, 1);
		this.smoothedLongAccel += (longAccel - this.smoothedLongAccel) * k;
		this.smoothedLatAccel += (latAccel - this.smoothedLatAccel) * k;

		// Weight transfer: forward accel pitches the nose up (squat), braking dives it; lateral
		// accel rolls the body. Both clamped so a hard input can't over-rotate the car.
		const pitchWT = MathUtils.clamp(
			PitchGainLong * this.smoothedLongAccel, -MaxWeightTransferTilt, MaxWeightTransferTilt
		);
		const rollWT = MathUtils.clamp(
			RollGainLat * this.smoothedLatAccel, -MaxWeightTransferTilt, MaxWeightTransferTilt
		);

		// Extra nose-up while boosting, so the burst of speed reads visually (eased by the spring).
		const boostLean = (this.boostKeyPressed && this.speed > 0) ? BoostLeanBack : 0;

		// Wheels ride the terrain pose exactly (always planted on the ground). The sprung body
		// chases the terrain pose PLUS the weight-transfer/boost lean through a damped spring, so
		// jagged terrain becomes a smooth bounce and the body travels a little relative to the
		// wheels (= the visible suspension). This is the ATV sprung/unsprung split.
		this.y = this.yTerrain;
		this.pitch = this.pitchTerrain;
		this.roll = this.rollTerrain;

		const stiffness = SuspensionFreq * SuspensionFreq;
		const damping = 2 * SuspensionDamping * SuspensionFreq;
		const spring = (value: number, vel: number, target: number): [number, number] => {
			const accel = stiffness * (target - value) - damping * vel;
			const newVel = vel + accel * dt;
			return [value + newVel * dt, newVel];
		};

		[this.bodyY, this.bodyYVel] = spring(this.bodyY, this.bodyYVel, this.yTerrain);
		[this.bodyPitch, this.bodyPitchVel] =
			spring(this.bodyPitch, this.bodyPitchVel, this.pitchTerrain + pitchWT + boostLean);
		[this.bodyRoll, this.bodyRollVel] = spring(this.bodyRoll, this.bodyRollVel, this.rollTerrain + rollWT);

		// Bound the body's travel off the wheel plane so a long climb can't let it drift far (which
		// would clip / look like sinking). Within these bounds it's free to bounce on its springs.
		this.bodyY = MathUtils.clamp(this.bodyY, this.yTerrain - MaxBodyHeave, this.yTerrain + MaxBodyHeave);
		this.bodyPitch = MathUtils.clamp(this.bodyPitch, this.pitchTerrain - MaxBodyTiltDev, this.pitchTerrain + MaxBodyTiltDev);
		this.bodyRoll = MathUtils.clamp(this.bodyRoll, this.rollTerrain - MaxBodyTiltDev, this.rollTerrain + MaxBodyTiltDev);

		this.prevSpeed = this.speed;
		this.prevHeading = this.heading;
	}

	private updateCamera(deltaTime: number): void {
		// Ease the zoom toward the scrolled target for a smooth animation (instead of snapping).
		this.camDistance += (this.camDistanceTarget - this.camDistance) * MathUtils.clamp(ZoomSmoothing * deltaTime, 0, 1);

		// Speed-based FOV punch (toggle F): widen the view with speed, eased in/out.
		if (this.baseFov > 0) {
			const targetExtra = this.fovEffectEnabled
				? MathUtils.clamp(Math.abs(this.speed) / BoostMaxSpeed, 0, 1) * FovSpeedGainDeg
				: 0;
			this.fovExtra += (targetExtra - this.fovExtra) * MathUtils.clamp(FovSmoothing * deltaTime, 0, 1);
			const newFov = this.baseFov + this.fovExtra;
			if (Math.abs(this.camera.fov - newFov) > 0.01) {
				this.camera.fov = newFov;
				this.camera.updateProjectionMatrix();
			}
		}

		// Follow the sprung body height (smooth) rather than the raw terrain (jagged).
		const p = this.currentPreset;

		if (this.isHoodCam) {
			// First-person hood cam: eye at the nose, looking forward along the heading (+ mouse-look).
			const forward = MathUtils.polarToCartesian(this.heading, 0); // horizontal forward
			const eye = new Vec3(this.x + forward.x * p.forward, this.bodyY + p.height, this.z + forward.z * p.forward);
			const lookDir = Vec3.normalize(MathUtils.polarToCartesian(this.heading + this.camYawOffset, -this.camPitch));
			const lookTarget = Vec3.add(eye, Vec3.multiplyScalar(lookDir, 10));

			this.camera.position.set(eye.x, eye.y, eye.z);
			this.camera.lookAt(lookTarget, false);
		} else {
			// Chase cam: eye behind the car; the look TARGET is ahead of + above the car (lookAhead /
			// lookUp) so the view is angled up toward where you're heading (Forza/GT7-style on the low
			// cams) instead of staring down at the roof. The MinCameraPitch floor keeps the eye off the map.
			const forwardH = MathUtils.polarToCartesian(this.heading + this.camYawOffset, 0); // horizontal forward
			const direction = Vec3.normalize(MathUtils.polarToCartesian(this.heading + this.camYawOffset, -this.camPitch));
			const cameraPosition = Vec3.add(new Vec3(this.x, this.bodyY, this.z), Vec3.multiplyScalar(direction, -this.camDistance));

			let eyeY = cameraPosition.y + p.height;

			// Fade the look-ahead out as the camera tilts down: aimed ahead/up for the low forward view,
			// but when you drag the cam down toward a top-down roof shot it aims at the CAR itself
			// (otherwise it'd look at the ground ahead and the car would slide out of frame). Smoothstep
			// the fade (ease in AND out) so the two views BLEND gradually — no perceptible "bump" at the
			// crossover where the camera used to visibly switch which point it tracks.
			const fadeT = MathUtils.clamp(1 - this.camPitch / LookAheadFadePitch, 0, 1);
			const aheadFade = fadeT * fadeT * (3 - 2 * fadeT);
			const target = new Vec3(
				this.x + forwardH.x * p.lookAhead * aheadFade,
				this.bodyY + p.lookUp * aheadFade,
				this.z + forwardH.z * p.lookAhead * aheadFade
			);

			// Keep the eye above the terrain DIRECTLY BELOW it so the low cams can't dip under a hill
			// when driving downhill (the eye sits up-slope behind the car). Raise the look target by the
			// SAME amount so the view angle is preserved — it stays aimed ahead instead of tilting down.
			const groundAtCam = this.terrainHeightProvider.getHeightGlobalInterpolated(
				cameraPosition.x, cameraPosition.z, true
			);
			if (groundAtCam !== null) {
				const minEyeY = groundAtCam + CameraGroundClearance;
				if (eyeY < minEyeY) {
					target.y += minEyeY - eyeY;
					eyeY = minEyeY;
				}
			}

			const idealEye = new Vec3(cameraPosition.x, eyeY, cameraPosition.z);

			// Natural lagging follow: ease the eye + aim toward their ideal (preset.smoothing > 0).
			// camSmoothInit makes the first frame after entry / a preset switch snap, so it never lerps
			// in from a stale position. smoothing == 0 = the old rigid behavior (used by the other cams).
			if (p.smoothing > 0 && this.camSmoothInit) {
				const k = MathUtils.clamp(p.smoothing * deltaTime, 0, 1);
				this.smoothedCamEye = Vec3.lerp(this.smoothedCamEye, idealEye, k);
				this.smoothedCamLookAt = Vec3.lerp(this.smoothedCamLookAt, target, k);
			} else {
				this.smoothedCamEye = idealEye;
				this.smoothedCamLookAt = target;
				this.camSmoothInit = true;
			}

			this.camera.position.set(this.smoothedCamEye.x, this.smoothedCamEye.y, this.smoothedCamEye.z);
			this.camera.lookAt(this.smoothedCamLookAt, false);
		}

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();
	}

	public update(deltaTime: number): void {
		this.updateMovement(deltaTime);
		this.updateSuspension(deltaTime);
		this.updateCamera(deltaTime);
	}

	public override enable(): void {
		super.enable();

		this.camera.near = 3;
		this.camera.far = 100000;

		// Capture the FOV at entry so the speed-based punch eases from (and restores to) it.
		this.baseFov = this.camera.fov;
		this.fovExtra = 0;
		this.camera.updateProjectionMatrix();

		// Re-center the chase cam behind the car each time drive mode is entered.
		this.camYawOffset = 0;
		this.camDistanceTarget = this.camDistance;
		this.camSmoothInit = false; // snap the smoothed cam on entry instead of easing in from a stale pose
	}

	public override disable(): void {
		super.disable();

		// Restore the FOV the speed punch was modifying.
		if (this.baseFov > 0) {
			this.camera.fov = this.baseFov;
			this.camera.updateProjectionMatrix();
		}

		// Release pointer-lock mouse-look when leaving drive mode.
		if (document.pointerLockElement === this.element) {
			document.exitPointerLock();
		}
	}

	public syncWithCamera(prevNavigator: ControlsNavigator): void {
		// Spawn is set explicitly via setCarPose() before enable(); nothing to do here.
	}

	public syncWithState(state: ControlsState): void {
		this.x = state.x;
		this.z = state.z;
		this.heading = state.yaw;
	}

	public getCurrentState(): ControlsState {
		return {
			x: this.x,
			z: this.z,
			pitch: this.camPitch,
			yaw: this.heading,
			distance: this.camDistance
		};
	}

	public lookAtNorth(): void {
		this.heading = 0;
	}
}
