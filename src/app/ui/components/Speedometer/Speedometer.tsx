import React, {useContext, useState} from "react";
import {useRecoilValue} from "recoil";
import styles from './Speedometer.scss';
import {AtomsContext} from "~/app/ui/UI";

const MsToMph = 2.23694;
const MsToKmh = 3.6;

const Speedometer: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const driveActive = useRecoilValue(atoms.driveActive);
	const driveSpeed = useRecoilValue(atoms.driveSpeed);

	// Unit toggle: mph by default, click to switch to metric (km/h).
	const [metric, setMetric] = useState<boolean>(false);

	if (!driveActive) {
		return null;
	}

	const speedMs = Math.abs(driveSpeed);
	const value = Math.round(speedMs * (metric ? MsToKmh : MsToMph));
	const unit = metric ? 'km/h' : 'mph';

	return (
		<div className={styles.speedometer} onClick={(): void => setMetric(!metric)} title="Click to toggle units">
			<div className={styles.speedometer__value}>{value}</div>
			<div className={styles.speedometer__unit}>{unit}</div>
		</div>
	);
};

export default React.memo(Speedometer);
