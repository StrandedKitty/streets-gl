import React from "react";
import styles from './ModalPanel.scss';
import PanelCloseButton from "~/app/ui/components/PanelCloseButton";

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
			<div className={styles.modal__close}>
				<PanelCloseButton onClick={onClose}/>
			</div>
			<div className={styles.modal__header}>{title}</div>
			<div className={styles.modal__body}>{children}</div>
		</div>
	);
}

export default React.memo(ModalPanel);