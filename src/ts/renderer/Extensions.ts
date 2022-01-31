export default class Extensions {
	private readonly gl: WebGL2RenderingContext;
	private readonly list: Map<string, any> = new Map<string, any>();

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;

		this.init();
	}

	private init() {
		const names: string[] = [
			'EXT_texture_filter_anisotropic',
			'EXT_color_buffer_float',
			'WEBGL_debug_renderer_info',
			'OES_texture_float_linear',
			'EXT_disjoint_timer_query_webgl2',
		];

		for(const ext of names) {
			this.list.set(ext, this.gl.getExtension(ext));
		}
	}

	public get(name: string): any {
		return this.list.get(name);
	}
}

