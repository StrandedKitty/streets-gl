import React from "react";
import {IconType} from "react-icons";
import styles from './CenteredIcon.scss';

const CenteredIcon: React.FC<{
	type: IconType;
	size: number;
}> = ({type, size}) => {
	const Icon = type;

	return <div className={styles.centeredIcon}>
		<Icon size={size} className={styles.centeredIcon__svg}/>
	</div>;
};

export default React.memo(CenteredIcon);