import * as RG from "~/render-graph";

export default abstract class Pass<T extends RG.ResourcePropMap> extends RG.Pass<T> {
	public abstract setSize(width: number, height: number): void;
}