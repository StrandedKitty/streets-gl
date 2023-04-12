import {Qualifier} from "~/lib/tile-processing/vector/qualifiers/Qualifier";

export default abstract class AbstractQualifierFactory<T> {
	public abstract fromTags(tags: Record<string, string>): Qualifier<T>[];
}