import OrthographicCamera from "../../core/OrthographicCamera";

export default class CSMCascadeCamera extends OrthographicCamera {
	public constructor({
		size,
		near,
		far
	}: {
		size: number;
		near: number;
		far: number;
	}) {
		super({
			left: -size,
			right: size,
			bottom: -size,
			top: size,
			near,
			far
		});
	}
}
