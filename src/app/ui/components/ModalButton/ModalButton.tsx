import React from "react";
import styles from "./ModalButton.scss";

const ModalButton: React.FC<{
	text: string;
	onClick?: () => void;
	icon?: React.ReactNode;
}> = ({text, onClick, icon}) => {
	return <button
		className={styles.button}
		onClick={(): void => {
			if (onClick) {
				onClick();
			}
		}}
	>
		{icon && <div className={styles.button__icon}>{icon}</div>}
		<div className={styles.button__text}>{text}</div>
	</button>;
}

export default React.memo(ModalButton);