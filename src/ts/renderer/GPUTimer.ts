import Renderer from "./Renderer";
import GLConstants from "./GLConstants";

export default class GPUTimer {
	private renderer: Renderer;
	private ext: any;
	private query: WebGLQuery = null;
	private results: Map<string, number> = new Map();

	public constructor(renderer: Renderer) {
		this.renderer = renderer;
		this.ext = this.renderer.extensions.get('EXT_disjoint_timer_query_webgl2');
	}

	public start(): void {
		this.query = this.renderer.gl.createQuery();
		this.renderer.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.query);
	}

	public stop(timerName: string): void {
		this.renderer.gl.endQuery(this.ext.TIME_ELAPSED_EXT);

		setTimeout(() => {
			if (this.query) {
				const available = this.renderer.gl.getQueryParameter(this.query, GLConstants.QUERY_RESULT_AVAILABLE);
				const disjoint = this.renderer.gl.getParameter(this.ext.GPU_DISJOINT_EXT);

				if (available && !disjoint) {
					const timeElapsed = this.renderer.gl.getQueryParameter(this.query, GLConstants.QUERY_RESULT);
					const ms = +(timeElapsed / 1e6).toFixed(3);

					this.results.set(timerName, ms);
				}

				if (available || disjoint) {
					this.renderer.gl.deleteQuery(this.query);

					this.query = null;
				}
			}
		}, 100);
	}

	public getResult(timerName: string): number {
		return this.results.get(timerName);
	}
}