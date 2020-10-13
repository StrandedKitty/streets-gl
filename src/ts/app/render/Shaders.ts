const Shaders = {
	building: {
		vertex: require('./shaders/building.vert'),
		fragment: require('./shaders/building.frag')
	},
	ground: {
		vertex: require('./shaders/ground.vert'),
		fragment: require('./shaders/ground.frag')
	},
	hdrCompose: {
		vertex: require('./shaders/hdrCompose.vert'),
		fragment: require('./shaders/hdrCompose.frag')
	}
}

export default Shaders;
