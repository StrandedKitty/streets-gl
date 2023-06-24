import {Qualifier} from "~/lib/tile-processing/vector/qualifiers/Qualifier";

export default abstract class AbstractQualifierFactory<T, K> {
	public abstract fromTags(tags: K): Qualifier<T>[];
}