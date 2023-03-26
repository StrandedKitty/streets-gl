import React from "react";
import styles from './ModalPar.scss';

const ModalPar: React.FC<{
	children: React.ReactNode;
	isSmall?: boolean;
}> = ({children, isSmall}) => {
	const classNames = styles.modalPar + ' ' + (isSmall ? styles['modalPar--small'] : '');

	return <div className={classNames}>{children}</div>;
}

export default React.memo(ModalPar);