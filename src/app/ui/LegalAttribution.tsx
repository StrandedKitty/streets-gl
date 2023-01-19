import React from "react";

const LegalAttribution: React.FC = () => {
	return <div className={'attribution'}>
		© <a href={'https://www.openstreetmap.org/copyright'} target={'_blank'}>OpenStreetMap</a>
		{' '}
		© <a href={'https://www.mapbox.com/about/maps/'} target={'_blank'}>Mapbox</a>
	</div>
}

export default LegalAttribution;