import System from "../System";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import SettingsSystem from "~/app/systems/SettingsSystem";
import TerrainSystem from "~/app/systems/TerrainSystem";
import SceneSystem from "~/app/systems/SceneSystem";
import Config from "~/app/Config";

interface QueryAircraft {
	id: string;
	lat: number;
	lon: number;
	altitude: number;
	heading: number;
	type: string;
	onGround: boolean;
	timestamp: number;
}

interface QueryVessel {
	id: string;
	lat: number;
	lon: number;
	heading: number;
	a: number;
	b: number;
	c: number;
	d: number;
}

interface AircraftState {
	x: number;
	y: number;
	altitude: number;
	heading: number;
	onGround: boolean;
	timestamp: number;
}

interface AircraftPosition {
	x: number;
	y: number;
	height: number;
	heading: number;
}

interface AircraftEntry {
	type: number;
	states: AircraftState[];
	isUpdatedTemp: boolean;
	lastPosition?: AircraftPosition;
}

interface VehiclesQueryResponse {
	timestamp: number;
	aircraft: QueryAircraft[][];
	vessels: QueryVessel[];
}

const QueryInterval = 10000;
const AircraftRollbackTime = 20000;

export default class VehicleSystem extends System {
	public readonly aircraftMap: Map<string, AircraftEntry> = new Map();
	private lastUpdateTimestamp: number = 0;
	private serverTimeOffset: number = null;
	private enabled: boolean = true;
	private lockAircraftPositions: boolean = false;

	public postInit(): void {
		this.listenToSettings();
		this.startTimer();
		this.addListeners();
	}

	private addListeners(): void {
		window.addEventListener('keydown', (e: KeyboardEvent): void => {
			if (e.code === 'KeyB' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();

				this.lockAircraftPositions = !this.lockAircraftPositions;
			}
		});
	}

	private listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		settings.onChange('airTraffic', ({statusValue}) => {
			this.enabled = statusValue === 'on';
		}, true);
	}

	private startTimer(): void {
		const fn = (): void => {
			if (this.enabled) {
				this.fetchData();
			}
		};

		setTimeout(fn, 0);
		setInterval(fn, QueryInterval);
	}

	public update(deltaTime: number): void {
	}

	public async fetchData(): Promise<void> {
		const camera = this.systemManager.getSystem(SceneSystem).objects.camera;
		const normalizedPosition = MathUtils.meters2tile(camera.position.x, camera.position.z, 0);

		fetch(`${Config.TileServerEndpoint}/vehicles/${normalizedPosition.x}/${normalizedPosition.y}`, {
			method: 'GET'
		}).then(async r => {
			const response: VehiclesQueryResponse = await r.json();

			if (this.serverTimeOffset === null) {
				this.serverTimeOffset = response.timestamp - Date.now();
			}

			this.handleQueryResponse(response);
		}).catch(() => {
			console.warn('Failed to fetch vehicles');
		});
	}

	private handleQueryResponse(response: VehiclesQueryResponse): void {
		for (const aircraft of this.aircraftMap.values()) {
			aircraft.isUpdatedTemp = false;
		}

		for (const aircraft of response.aircraft) {
			const id = aircraft[0].id;
			const states = aircraft.map(VehicleSystem.convertQueryAircraftToAircraftState);
			const oldAircraft = this.aircraftMap.get(id);

			this.aircraftMap.set(id, {
				states: states,
				type: VehicleSystem.getPlaneTypeInteger(aircraft[0]),
				lastPosition: oldAircraft?.lastPosition,
				isUpdatedTemp: true
			});
		}

		for (const [key, aircraft] of this.aircraftMap.entries()) {
			if (!aircraft.isUpdatedTemp) {
				this.aircraftMap.delete(key);
			}
		}

		this.lastUpdateTimestamp = Date.now();
	}

	public getAircraftBuffer(origin: Vec2, type: number): Float32Array {
		if (!this.enabled) {
			return new Float32Array();
		}

		const aircraftOfType: AircraftEntry[] = [];

		for (const aircraft of this.aircraftMap.values()) {
			if (aircraft.type === type) {
				aircraftOfType.push(aircraft);
			}
		}

		if (aircraftOfType.length === 0) {
			return new Float32Array();
		}

		const buffer = new Float32Array(aircraftOfType.length * 4);
		let i = 0;

		for (const aircraft of aircraftOfType) {
			const position = this.getAircraftPosition(aircraft);

			buffer[i++] = position.x - origin.x;
			buffer[i++] = position.height;
			buffer[i++] = position.y - origin.y;
			buffer[i++] = position.heading;
		}

		return buffer;
	}

	private getAircraftPosition(aircraft: AircraftEntry): AircraftPosition {
		if (this.lockAircraftPositions && aircraft.lastPosition) {
			return aircraft.lastPosition;
		}

		const lerpedPosition = this.lerpAircraftStates(aircraft.states);
		aircraft.lastPosition = lerpedPosition;

		return lerpedPosition;
	}

	private lerpAircraftStates(states: AircraftState[]): AircraftPosition {
		const serverTime = Date.now() + this.serverTimeOffset - AircraftRollbackTime;

		if (states.length > 1) {
			for (let i = 0; i < states.length - 1; i++) {
				const a = states[i];
				const b = states[i + 1];

				if (serverTime >= a.timestamp && serverTime < b.timestamp) {
					const progress = (serverTime - a.timestamp) / (b.timestamp - a.timestamp);
					const lerpedX = MathUtils.lerp(a.x, b.x, progress);
					const lerpedY = MathUtils.lerp(a.y, b.y, progress);
					const height = this.getActualAltitude(a, b, progress);
					const lerpedHeading = MathUtils.lerpAngle(a.heading, b.heading, progress);

					return {
						x: lerpedX,
						y: lerpedY,
						height: height,
						heading: lerpedHeading
					};
				}
			}
		}

		const lastState = states[states.length - 1];

		return {
			x: lastState.x,
			y: lastState.y,
			height: this.getActualAltitude(lastState, lastState, 0),
			heading: lastState.heading,
		};
	}

	private getActualAltitude(
		stateFrom: AircraftState,
		stateTo: AircraftState,
		progress: number
	): number {
		const heightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;
		const x = MathUtils.lerp(stateFrom.x, stateTo.x, progress);
		const y = MathUtils.lerp(stateFrom.y, stateTo.y, progress);

		const mercatorScale = MathUtils.getMercatorScaleFactor(MathUtils.meters2degrees(x, y).lat);
		const height = heightProvider.getHeightGlobalInterpolated(x, y, true);
		const lerpedAltitude = MathUtils.lerp(stateFrom.altitude, stateTo.altitude, progress);
		const correctedAltitude = lerpedAltitude * mercatorScale;

		if (stateFrom.onGround && stateTo.onGround) {
			return height ?? correctedAltitude;
		}

		if (stateFrom.onGround && !stateTo.onGround) {
			let heightFrom = heightProvider.getHeightGlobalInterpolated(stateFrom.x, stateFrom.y, true);
			const heightTo = stateTo.altitude * mercatorScale;

			if (heightFrom === null) {
				heightFrom = stateFrom.altitude * mercatorScale;
			}

			return MathUtils.lerp(heightFrom, heightTo, progress);
		}

		if (!stateFrom.onGround && stateTo.onGround) {
			const heightFrom = stateFrom.altitude * mercatorScale;
			let heightTo = heightProvider.getHeightGlobalInterpolated(stateTo.x, stateTo.y, true);

			if (heightTo === null) {
				heightTo = stateTo.altitude * mercatorScale;
			}

			return MathUtils.lerp(heightFrom, heightTo, progress);
		}

		if (height === null || correctedAltitude > height) {
			return correctedAltitude;
		}

		return height;
	}

	private static convertQueryAircraftToAircraftState(query: QueryAircraft): AircraftState {
		const {x, y} = MathUtils.degrees2meters(query.lat, query.lon);
		return {
			x,
			y,
			altitude: query.altitude,
			heading: MathUtils.toRad(-query.heading),
			onGround: query.onGround,
			timestamp: query.timestamp
		};
	}

	private static getPlaneTypeInteger(state: QueryAircraft): number {
		switch (state.type) {
			case 'B738':
			case 'B737':
			case 'B38M':
			case 'E75L':
			case 'B739':
			case 'B77W':
			case 'B763':
			case 'B789':
			case 'E190':
			case 'B752':
			case 'B77L':
			case 'B788':
			case 'BCS3':
			case 'B744':
			case 'B772':
			case 'B39M':
				return 0;
			case 'A320':
			case 'A321':
			case 'A20N':
			case 'A319':
			case 'A21N':
			case 'A359':
			case 'A333':
			case 'A332':
				return 1;
			case 'C172':
			case 'P28A':
			case 'PC12':
			case 'C208':
			case 'SR22':
			case 'C152':
			case 'SR20':
			case 'C182':
			case 'DA40':
			case 'C72R':
				return 2;
			case 'CRJ9':
			case 'E55P':
			case 'CRJ7':
			case 'BE20':
			case 'C56X':
			case 'CL30':
			case 'CRJ2':
			case 'C68A':
			case 'C25A':
				return 3;
		}

		return 0;
	}
}
