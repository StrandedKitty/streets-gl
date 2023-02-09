import React, {useContext} from "react";
import Panel from "~/app/ui/components/Panel";
import Compass from "~/app/ui/components/Compass";
import './CompassPanel.scss';
import {useRecoilValue} from "recoil";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";

const CompassPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);
	const direction = useRecoilValue(atoms.northDirection);

	return <Panel className={'compass-panel'}>
		<Compass direction={direction} onReset={actions.lookAtNorth}/>
	</Panel>;
}

export default React.memo(CompassPanel);