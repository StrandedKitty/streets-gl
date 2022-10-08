import System from "../System";
import SystemManager from "../SystemManager";
import ControlsSystem from "./ControlsSystem";
import MathUtils from "../../math/MathUtils";
import Vec3 from "../../math/Vec3";
import Config from "../Config";
import SunCalc from 'suncalc';
import Easing from "../../math/Easing";
import UISystem from "~/app/systems/UISystem";

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
	public lightIntensity = 0;
	public ambientIntensity = 0;

	public sunDirection: Vec3 = null;
	public moonDirection: Vec3 = null;

	private transitionProgress = 1;
	private sunTransitionStart: Vec3 = null;
	private moonTransitionStart: Vec3 = null;

	public constructor(systemManager: SystemManager) {
		super(systemManager);
	}

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
					MathUtils.sphericalToCartesian(sunPosition.azimuth + Math.PI, sunPosition.altitude),
					MathUtils.sphericalToCartesian(moonPosition.azimuth + Math.PI, moonPosition.altitude)
				];
			}
			case MapTimeState.Static: {
				return this.staticLights;
			}
		}

		return [new Vec3(), new Vec3()];
	}

	private doTransition(targetSunDirection: Vec3, targetMoonDirection: Vec3, deltaTime: number): void {
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

		this.transitionProgress += deltaTime / Config.LightTransitionDuration;
		this.transitionProgress = Math.min(1, this.transitionProgress);
	}

	private getSmoothedTransitionProgress(): number {
		return Easing.easeOutQuart(this.transitionProgress);
	}

	private updateTime(): void {
		const newTime = this.systemManager.getSystem(UISystem).mapTime;
		const diff = Math.abs(newTime - this.time);

		if (diff > 1e6 && this.sunDirection && this.moonDirection) {
			this.sunTransitionStart = Vec3.clone(this.sunDirection);
			this.moonTransitionStart = Vec3.clone(this.moonDirection);
			this.transitionProgress = 0;
		}

		this.time = newTime;
	}

	public update(deltaTime: number): void {
		this.updateTime();

		const [targetSunDirection, targetMoonDirection] = this.getTargetSunAndMoonDirection();

		this.doTransition(targetSunDirection, targetMoonDirection, deltaTime);

		if (this.sunDirection.y < 0) {
			this.lightIntensity = 6;
			this.ambientIntensity = 0.2;
			this.lightDirection = this.sunDirection;
		} else {
			this.ambientIntensity = 0.1;
			this.lightDirection = this.moonDirection;

			if (this.moonDirection.y < 0) {
				this.lightIntensity = 0.05;

			} else {
				this.lightIntensity = 0;
			}
		}
	}
}