import React, {useEffect, useState} from "react";
import UI from "./UI";

const SelectionInfo: React.FC = () => {
	const [activeFeatureId, setActiveFeatureId] = useState<number>(null);
	const [activeFeatureType, setActiveFeatureType] = useState<number>(null);

	useEffect(() => {
		UI.listenToField('activeFeatureId', (id: number) => setActiveFeatureId(id));
		UI.listenToField('activeFeatureType', (type: number) => setActiveFeatureType(type));
	}, []);

	const getActiveFeatureTitle = (): string => {
		return `${activeFeatureType === 0 ? 'Way' : 'Relation'} ${activeFeatureId}`;
	}

	const getActiveFeatureLink = (): string => {
		return `https://www.openstreetmap.org/${activeFeatureType === 0 ? 'way' : 'relation'}/${activeFeatureId}`;
	}

	if (activeFeatureId === null) {
		return null;
	}

	return (
		<div className='selection-info-wrapper'>
			<div className='selection-info' id='selected-feature-container'>
				<div className='selection-info-header'>{getActiveFeatureTitle()}</div>
				<div className='selection-info-link'>
					<a href={getActiveFeatureLink()} target='_blank'>Open on openstreetmap.org</a>
				</div>
			</div>
		</div>
	);
}

export default SelectionInfo;