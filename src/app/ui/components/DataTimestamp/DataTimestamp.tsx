import React, {useContext} from "react";
import {useRecoilValue} from "recoil";
import styles from './DataTimestamp.scss';
import {AtomsContext} from "~/app/ui/UI";

const DataTimestamp: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const date = useRecoilValue(atoms.dataTimestamp);

	return (
		<div className={styles.timestamp}>
			Data updated on {date ? date.toLocaleDateString() : '???'} at {date ? date.toLocaleTimeString() : '???'}
		</div>
	);
};

export default React.memo(DataTimestamp);
