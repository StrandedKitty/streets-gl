import System from "../System";
import SystemManager from "../SystemManager";
import ControlsSystem from "./ControlsSystem";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import Config from "../Config";
import SunCalc from 'suncalc';
import Easing from "~/lib/math/Easing";
import UISystem from "./UISystem";
import {createTimeOfInterest} from "astronomy-bundle/time";
import {createStar} from "astronomy-bundle/stars";
import {createLocation} from "astronomy-bundle/earth";
import Mat4 from "~/lib/math/Mat4";
import UI from "~/app/ui/UI";

const StaticPresets: [Vec3, Vec3][] = [
	[new Vec3(-1, -1, -1).normalize(), new Vec3(0, 1, 0).normalize()],
	[new Vec3(-1, -3, -1).normalize(), new Vec3(0, 1, 0).normalize()],
	[new Vec3(1, -0.3, 1).normalize(), new Vec3(0, 1, 0).normalize()],
	[new Vec3(0, 1, 0).normalize(), new Vec3(-1, -1, -1).normalize()]
];

enum MapTimeState {
	Dynamic,
	Static
}

export default class MapTimeSystem extends System {
	private state: MapTimeState = MapTimeState.Dynamic;
	private staticLights: [Vec3, Vec3] = StaticPresets[0];

	private time: number = 0;
	public lightDirection: Vec3 = new Vec3();
	public lightIntensity: number = 0;
	public ambientIntensity: number = 0;

	public sunDirection: Vec3 = null;
	public moonDirection: Vec3 = null;
	public skyDirection: [Vec3, Vec3, Vec3] = null;

	public skyDirectionTarget: [Vec3, Vec3, Vec3] = null;
	public skyDirectionMatrix: Mat4 = Mat4.identity();

	private transitionProgress: number = 1;
	private sunTransitionStart: Vec3 = null;
	private moonTransitionStart: Vec3 = null;
	private skyTransitionStart: [Vec3, Vec3, Vec3] = null;

	public windowLightThreshold: number = 0;

	public postInit(): void {

	}

	public setState(state: number): void {
		if (state === 0) {
			this.state = MapTimeState.Dynamic;
			return;
		}

		const presetId = state - 1;
		this.staticLights = StaticPresets[presetId];
		this.state = MapTimeState.Static;
	}

	private getTargetSunAndMoonDirection(): [Vec3, Vec3] {
		switch (this.state) {
			case MapTimeState.Dynamic: {
				const latLon = this.systemManager.getSystem(ControlsSystem).getLatLon();
				const date = new Date(this.time);
				const sunPosition = SunCalc.getPosition(date, latLon.lat, latLon.lon);
				const moonPosition = SunCalc.getMoonPosition(date, latLon.lat, latLon.lon);

				return [
					Vec3.multiplyScalar(MathUtils.polarToCartesian(sunPosition.azimuth + Math.PI, sunPosition.altitude), -1),
					Vec3.multiplyScalar(MathUtils.polarToCartesian(moonPosition.azimuth + Math.PI, moonPosition.altitude), -1),
				];
			}
			case MapTimeState.Static: {
				return this.staticLights;
			}
		}

		return [new Vec3(), new Vec3()];
	}

	private updateTargetSkyDirection(): void {
		const toi = createTimeOfInterest.fromDate(new Date(this.time));

		const pointX = {
			rightAscension: 90,
			declination: 0,
			radiusVector: 1,
		};
		const pointY = {
			rightAscension: 90,
			declination: 90,
			radiusVector: 1,
		};
		const pointZ = {
			rightAscension: 180,
			declination: 0,
			radiusVector: 1,
		};

		const starX = createStar.byEquatorialCoordinates(pointX, toi);
		const starY = createStar.byEquatorialCoordinates(pointY, toi);
		const starZ = createStar.byEquatorialCoordinates(pointZ, toi);

		const latLon = this.systemManager.getSystem(ControlsSystem).getLatLon();
		const location = createLocation(latLon.lat, latLon.lon);

		Promise.all([
			starX.getTopocentricHorizontalCoordinates(location),
			starY.getTopocentricHorizontalCoordinates(location),
			starZ.getTopocentricHorizontalCoordinates(location),
		]).then(([r1, r2, r3]) => {
			const px = MathUtils.polarToCartesian(MathUtils.toRad(r1.azimuth), MathUtils.toRad(r1.altitude));
			const py = MathUtils.polarToCartesian(MathUtils.toRad(r2.azimuth), MathUtils.toRad(r2.altitude));
			const pz = MathUtils.polarToCartesian(MathUtils.toRad(r3.azimuth), MathUtils.toRad(r3.altitude));

			this.skyDirectionTarget = [px, py, pz];
		});
	}

	private updateSkyDirectionMatrix(): void {
		if (!this.skyDirection) {
			return;
		}

		const [px, py, pz] = this.skyDirection;

		this.skyDirectionMatrix.values[0] = px.x;
		this.skyDirectionMatrix.values[4] = px.y;
		this.skyDirectionMatrix.values[8] = px.z;

		this.skyDirectionMatrix.values[1] = py.x;
		this.skyDirectionMatrix.values[5] = py.y;
		this.skyDirectionMatrix.values[9] = py.z;

		this.skyDirectionMatrix.values[2] = pz.x;
		this.skyDirectionMatrix.values[6] = pz.y;
		this.skyDirectionMatrix.values[10] = pz.z;
	}

	private doTransition(targetSunDirection: Vec3, targetMoonDirection: Vec3, targetSkyDirection: [Vec3, Vec3, Vec3], deltaTime: number): void {
		if (this.sunDirection === null || this.sunTransitionStart === null) {
			this.sunDirection = targetSunDirection;
		} else {
			this.sunDirection = Vec3.nlerp(
				this.sunTransitionStart,
				targetSunDirection,
				this.getSmoothedTransitionProgress()
			);
		}

		if (this.moonDirection === null || this.moonTransitionStart === null) {
			this.moonDirection = targetMoonDirection;
		} else {
			this.moonDirection = Vec3.nlerp(
				this.moonTransitionStart,
				targetMoonDirection,
				this.getSmoothedTransitionProgress()
			);
		}

		if (this.skyDirection === null || this.skyTransitionStart === null) {
			this.skyDirection = targetSkyDirection;
		} else {
			this.skyDirection = [
				Vec3.nlerp(this.skyTransitionStart[0], targetSkyDirection[0], this.getSmoothedTransitionProgress()),
				Vec3.nlerp(this.skyTransitionStart[1], targetSkyDirection[1], this.getSmoothedTransitionProgress()),
				Vec3.nlerp(this.skyTransitionStart[2], targetSkyDirection[2], this.getSmoothedTransitionProgress())
			];
		}

		this.updateSkyDirectionMatrix();

		this.transitionProgress += deltaTime / Config.LightTransitionDuration;
		this.transitionProgress = Math.min(1, this.transitionProgress);
	}

	private getSmoothedTransitionProgress(): number {
		return Easing.easeOutQuart(this.transitionProgress);
	}

	private updateTime(): void {
		const newTime = this.systemManager.getSystem(UISystem).mapTime;
		const diff = Math.abs(newTime - this.time);

		if (diff > 1e6 && this.sunDirection && this.moonDirection && this.skyDirection) {
			this.sunTransitionStart = Vec3.clone(this.sunDirection);
			this.moonTransitionStart = Vec3.clone(this.moonDirection);
			this.skyTransitionStart = [
				Vec3.clone(this.skyDirection[0]),
				Vec3.clone(this.skyDirection[1]),
				Vec3.clone(this.skyDirection[2])
			];
			this.transitionProgress = 0;
		}

		this.time = newTime;
	}

	public update(deltaTime: number): void {
		this.updateTime();

		const [targetSunDirection, targetMoonDirection] = this.getTargetSunAndMoonDirection();
		this.updateTargetSkyDirection();

		this.doTransition(targetSunDirection, targetMoonDirection, this.skyDirectionTarget, deltaTime);

		if (this.sunDirection.y < 0) {
			this.lightIntensity = 6;
			this.ambientIntensity = 0.2;
			this.lightDirection = this.sunDirection;
		} else {
			this.ambientIntensity = 0.1;
			this.lightDirection = this.moonDirection;
			this.lightIntensity = 0;
		}

		this.windowLightThreshold = MathUtils.clamp(this.sunDirection.y * 5. + 0.2, 0, 1);
	}
}