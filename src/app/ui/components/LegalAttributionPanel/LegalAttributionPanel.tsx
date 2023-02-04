import React from "react";
import Panel from "~/app/ui/components/Panel";
import './LegalAttributionPanel.scss';

const LegalAttribution: React.FC = () => {
	return <Panel className={'attribution-panel'}>
		© <a href={'https://www.openstreetmap.org/copyright'} target={'_blank'}>OpenStreetMap</a>
		{' '}
		© <a href={'https://www.mapbox.com/about/maps/'} target={'_blank'}>Mapbox</a>
	</Panel>
}

export default React.memo(LegalAttribution);