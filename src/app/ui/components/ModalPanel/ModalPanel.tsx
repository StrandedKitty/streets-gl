import React from "react";
import styles from './ModalPanel.scss';
import ParStyles from './ModalPar.scss';
import TableStyles from './ModalTable.scss';

const ModalPanel: React.FC<{
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}> = (
	{
		title,
		onClose,
		children
	}
) => {
	return (
		<div className={styles.modal}>
			<button
				className={styles.modal__close}
				onClick={onClose}
			>×</button>
			<div className={styles.modal__header}>{title}</div>
			<div className={styles.modal__body}>{children}</div>
		</div>
	);
}

export {ParStyles, TableStyles};
export default React.memo(ModalPanel);