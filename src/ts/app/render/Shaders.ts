const Shaders = {
	building: {
		vertex: require('../../../resources/shaders/building.vert'),
		fragment: require('../../../resources/shaders/building.frag')
	},
	buildingDepth: {
		vertex: require('../../../resources/shaders/buildingDepth.vert'),
		fragment: require('../../../resources/shaders/buildingDepth.frag')
	},
	ground: {
		vertex: require('../../../resources/shaders/ground.vert'),
		fragment: require('../../../resources/shaders/ground.frag')
	},
	groundDepth: {
		vertex: require('../../../resources/shaders/groundDepth.vert'),
		fragment: require('../../../resources/shaders/groundDepth.frag')
	},
	skybox: {
		vertex: require('../../../resources/shaders/skybox.vert'),
		fragment: require('../../../resources/shaders/skybox.frag')
	},
	hdrCompose: {
		vertex: require('../../../resources/shaders/hdrCompose.vert'),
		fragment: require('../../../resources/shaders/hdrCompose.frag')
	},
	ldrCompose: {
		vertex: require('../../../resources/shaders/ldrCompose.vert'),
		fragment: require('../../../resources/shaders/ldrCompose.frag')
	},
	taa: {
		vertex: require('../../../resources/shaders/taa.vert'),
		fragment: require('../../../resources/shaders/taa.frag')
	},
	objectFilter: {
		vertex: require('../../../resources/shaders/objectFilter.vert'),
		fragment: require('../../../resources/shaders/objectFilter.frag')
	},
	gaussianBlur: {
		vertex: require('../../../resources/shaders/gaussianBlur.vert'),
		fragment: require('../../../resources/shaders/gaussianBlur.frag')
	},
	ssao: {
		vertex: require('../../../resources/shaders/ssao.vert'),
		fragment: require('../../../resources/shaders/ssao.frag')
	},
	bilateralBlur: {
		vertex: require('../../../resources/shaders/bilateralBlur.vert'),
		fragment: require('../../../resources/shaders/bilateralBlur.frag')
	}
}

export default Shaders;
