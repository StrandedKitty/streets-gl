const Shaders = {
	building: {
		vertex: require('../../../resources/shaders/building.vert'),
		fragment: require('../../../resources/shaders/building.frag')
	},
	ground: {
		vertex: require('../../../resources/shaders/ground.vert'),
		fragment: require('../../../resources/shaders/ground.frag')
	},
	skybox: {
		vertex: require('../../../resources/shaders/skybox.vert'),
		fragment: require('../../../resources/shaders/skybox.frag')
	},
	hdrCompose: {
		vertex: require('../../../resources/shaders/hdrCompose.vert'),
		fragment: require('../../../resources/shaders/hdrCompose.frag')
	}
}

export default Shaders;
