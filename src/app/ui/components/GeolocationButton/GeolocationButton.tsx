import React, {useContext, useState} from "react";
import './GeolocationButton.scss';
import {ActionsContext, AtomsContext} from "~/app/ui/UI";
import {ImSpinner2} from "react-icons/im";
import {MdOutlineMyLocation} from "react-icons/md";

const isGeolocationSupported = !!navigator.geolocation;
const geolocationOptions = {
	enableHighAccuracy: true,
	timeout: 30000,
	maximumAge: 300_000
};

const getPosition = async (): Promise<[number, number]> => {
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(position => {
			resolve([position.coords.latitude, position.coords.longitude]);
		}, err => {
			console.error(err);
			resolve(null);
		}, geolocationOptions);
	});
}

const GeolocationButton: React.FC = () => {
	const actions = useContext(ActionsContext);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	if (!isGeolocationSupported) {
		return null;
	}

	let buttonClassNames = 'geolocation-button';

	if (isLoading) {
		buttonClassNames += ' geolocation-button-disabled';
	}

	return <div className={buttonClassNames} onClick={(): void => {
		if (isLoading) {
			return;
		}

		setIsLoading(true);
		getPosition().then(pos => {
			if (pos) {
				actions.goToLatLon(pos[0], pos[1]);
			}

			setIsLoading(false);
		});
	}}>
		<div className={'icon'}>
			{
				isLoading ? <ImSpinner2 className={'spinner'}/> : <MdOutlineMyLocation/>
			}
		</div>
	</div>
}

export default React.memo(GeolocationButton);