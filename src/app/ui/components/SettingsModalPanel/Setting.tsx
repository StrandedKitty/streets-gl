import React from "react";
import styles from "./Setting.scss";

const Setting: React.FC<{
	name: string;
	isSub?: boolean;
	children: React.ReactNode;
}> = ({name, isSub, children}) => {
	let classNames = styles.settingsRow;

	if (isSub) {
		classNames += ' ' + styles['settingsRow--sub'];
	}

	return <div className={classNames}>
		<div className={styles.settingsRow__title}>{name}</div>
		<div className={styles.settingsRow__body}>{children}</div>
	</div>;
}

export default React.memo(Setting);