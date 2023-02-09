import React, {useContext, useMemo} from "react";
import {useRecoilState} from "recoil";
import "./SelectionPanel.scss";
import Panel from "~/app/ui/components/Panel";
import {AtomsContext} from "~/app/ui/UI";

const SelectionPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const [activeFeatureId, setActiveFeatureId] = useRecoilState(atoms.activeFeatureId);
	const [activeFeatureType, setActiveFeatureType] = useRecoilState(atoms.activeFeatureType);

	const {title, link} = useMemo(() => {
		return {
			title: `${activeFeatureType === 0 ? 'Way' : 'Relation'} ${activeFeatureId}`,
			link: `https://www.openstreetmap.org/${activeFeatureType === 0 ? 'way' : 'relation'}/${activeFeatureId}`
		}
	}, [activeFeatureId, activeFeatureType]);

	if (activeFeatureId === null) {
		return null;
	}

	return (
		<Panel className='selection-info-panel'>
			<div className='selection-info'>
				<div className='header'>{title}</div>
				<div className='link'>
					<a href={link} target='_blank'>Open on openstreetmap.org</a>
				</div>
			</div>
		</Panel>
	);
}

export default React.memo(SelectionPanel);