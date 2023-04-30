export default interface RenderGraphSnapshot {
	graph: {
		type: 'resource' | 'pass';
		name: string;
		metadata: Record<string, string>;
		localResources?: Record<string, string>[];
		prev: string[];
		next: string[];
	}[];
	passOrder: string[];
}