const Shaders = {
	basic: {
		vertex: require('./shaders/basic.vert'),
		fragment: require('./shaders/basic.frag')
	},
	ground: {
		vertex: require('./shaders/ground.vert'),
		fragment: require('./shaders/ground.frag')
	}
}

export default Shaders;
