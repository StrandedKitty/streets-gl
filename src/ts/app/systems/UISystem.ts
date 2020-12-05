import System from "../System";
import SystemManager from "../SystemManager";

interface FeatureLink {
	type: number;
	id: number;
}

export default class UISystem extends System {
	private activeFeature: FeatureLink = null;

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();
	}

	private init() {
		document.getElementById('ui').addEventListener('click', event => {
			event.stopPropagation();
		});

		this.updateFeatureInfo();
	}

	public postInit() {

	}

	public setActiveFeature(type: number, id: number) {
		if(!this.activeFeature || this.activeFeature.id !== id || this.activeFeature.type !== type) {
			this.activeFeature = {type, id};
			this.updateFeatureInfo();
		}
	}

	public clearActiveFeature() {
		if(this.activeFeature) {
			this.activeFeature = null;
			this.updateFeatureInfo();
		}
	}

	private updateFeatureInfo() {
		const containerElement = document.getElementById('selected-feature-container');
		const nameElement = document.getElementById('selected-feature-name');
		const linkElement = document.getElementById('selected-feature-link');

		if(this.activeFeature) {
			const {id, type} = this.activeFeature;

			nameElement.innerText = `${type === 0 ? 'Way' : 'Relation'} ${id}`;
			linkElement.setAttribute('href', `https://www.openstreetmap.org/${type === 0 ? 'way' : 'relation'}/${id}`);
			containerElement.style.display = 'block';
		} else {
			nameElement.innerText = '';
			linkElement.setAttribute('href', '');
			containerElement.style.display = 'none';
		}
	}


	public update(deltaTime: number) {

	}
}