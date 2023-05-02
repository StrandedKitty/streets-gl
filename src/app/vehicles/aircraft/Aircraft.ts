import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";

export enum AircraftType {
	B777,
	A321,
	Cessna208,
	ERJ135,
	Helicopter
}

export interface AircraftState {
	x: number;
	y: number;
	altitude: number;
	heading: number;
	onGround: boolean;
	timestamp: number;
}

export interface AircraftPosition {
	x: number;
	y: number;
	height: number;
	heading: number;
	onGround: boolean;
}

export enum AircraftPartType {
	B777Body,
	A321Body,
	Cessna208Body,
	ERJ135Body,
	HelicopterBody,
	HelicopterRotorStatic,
	HelicopterTailRotorStatic,
	HelicopterRotorSpinning,
	HelicopterTailRotorSpinning
}

export interface AircraftPart {
	type: AircraftPartType;
	position: Vec3;
	rotation: Vec3;
}

export default class Aircraft {
	public readonly type: AircraftType;
	public states: AircraftState[];
	public isUpdatedTemp: boolean = false
	public position: AircraftPosition = null;
	private rotationOffset: number = Math.random() * Math.PI * 2;

	public constructor(type: AircraftType) {
		this.type = type;
	}

	public update(states: AircraftState[]): void {
		this.states = states;
		this.isUpdatedTemp = true;
	}

	public getParts(): AircraftPart[] {
		const origin = new Vec3(this.position.x, this.position.height, this.position.y);

		switch (this.type) {
			case AircraftType.B777:
				return [{
					type: AircraftPartType.B777Body,
					position: origin,
					rotation: new Vec3(0, this.position.heading, 0)
				}];
			case AircraftType.A321:
				return [{
					type: AircraftPartType.A321Body,
					position: origin,
					rotation: new Vec3(0, this.position.heading, 0)
				}];
			case AircraftType.Cessna208:
				return [{
					type: AircraftPartType.Cessna208Body,
					position: origin,
					rotation: new Vec3(0, this.position.heading, 0)
				}];
			case AircraftType.ERJ135:
				return [{
					type: AircraftPartType.ERJ135Body,
					position: origin,
					rotation: new Vec3(0, this.position.heading, 0)
				}];
			case AircraftType.Helicopter:
				const parts: AircraftPart[] = [{
					type: AircraftPartType.HelicopterBody,
					position: origin,
					rotation: new Vec3(0, this.position.heading, 0)
				}];

				const rotorOffset = new Vec3(-0.26695, 3.1127, -0.001246);
				const rotorOffsetRotated = Vec3.rotateAroundAxis(
					rotorOffset,
					new Vec3(0, 1, 0),
					this.position.heading
				);
				const tailRotorOffset = new Vec3(-6.18596, 1.8799, -0.358049);
				const tailRotorOffsetRotated = Vec3.rotateAroundAxis(
					tailRotorOffset,
					new Vec3(0, 1, 0),
					this.position.heading
				);

				const rotation = this.getRotation();

				parts.push({
					type: this.position.onGround ? AircraftPartType.HelicopterRotorStatic : AircraftPartType.HelicopterRotorSpinning,
					position: Vec3.add(origin, rotorOffsetRotated),
					rotation: new Vec3(0, this.position.heading + rotation, 0)
				});
				parts.push({
					type: this.position.onGround ? AircraftPartType.HelicopterTailRotorStatic : AircraftPartType.HelicopterTailRotorSpinning,
					position: Vec3.add(origin, tailRotorOffsetRotated),
					rotation: new Vec3(0, this.position.heading, rotation + Math.PI / 2)
				});

				return parts;
		}
	}

	private getRotation(): number {
		if (this.position.onGround) {
			return this.rotationOffset;
		}

		return this.rotationOffset + ((performance.now() * 0.002) % 1) * Math.PI * 2;
	}
}