import React from "react";
import Panel from "~/app/ui/components/Panel";
import Compass from "~/app/ui/components/Compass";
import './CompassPanel.scss';

const CompassPanel: React.FC<{
	direction: number;
	onReset?: () => void;
}> = ({direction, onReset}) => {
	return <Panel className={'compass-panel'}>
		<Compass direction={direction} onReset={onReset}/>
	</Panel>;
}

export default React.memo(CompassPanel);