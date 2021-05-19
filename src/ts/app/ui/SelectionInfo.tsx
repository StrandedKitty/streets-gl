import React from "react";

export default class SelectionInfo extends React.Component<{
	activeFeatureId: number,
	activeFeatureType: number
}> {
	private getActiveFeatureTitle() {
		return `${this.props.activeFeatureType === 0 ? 'Way' : 'Relation'} ${this.props.activeFeatureId}`;
	}

	private getActiveFeatureLink() {
		return `https://www.openstreetmap.org/${this.props.activeFeatureType === 0 ? 'way' : 'relation'}/${this.props.activeFeatureId}`;
	}

	public render() {
		return (
			<div className='selection-info-wrapper'>
				<div className='selection-info' id='selected-feature-container'>
					<div className='selection-info-header'>{this.getActiveFeatureTitle()}</div>
					<div className='selection-info-link'>
						<a href={this.getActiveFeatureLink()} target='_blank'>Open on openstreetmap.org</a>
					</div>
				</div>
			</div>
		);
	}
}