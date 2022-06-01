interface EXT_disjoint_timer_query_webgl2 {
	QUERY_COUNTER_BITS_EXT: number;
	TIME_ELAPSED_EXT: number;
	TIMESTAMP_EXT: number;
	GPU_DISJOINT_EXT: number;
	queryCounterEXT(query: WebGLQuery, target: GLenum): undefined;
}

export default interface WebGL2Extensions {
	anisotropy: EXT_texture_filter_anisotropic;
	floatRenderable: EXT_color_buffer_float;
	debugInfo: WEBGL_debug_renderer_info;
	floatLinear: OES_texture_float_linear;
	timerQuery: EXT_disjoint_timer_query_webgl2;
	rendererInfo: WEBGL_debug_renderer_info;
}