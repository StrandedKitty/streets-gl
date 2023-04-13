import React from "react";
import styles from "./ModalButton.scss";
import {ImSpinner2} from "react-icons/im";

const ModalButton: React.FC<{
	text: string;
	onClick?: () => void;
	icon?: React.ReactNode;
	isLoading?: boolean;
}> = ({text, onClick, icon, isLoading}) => {
	let iconClassNames = styles.button__icon;
	if (isLoading) {
		iconClassNames += ' ' + styles['button__icon--hidden'];
	}

	let textClassNames = styles.button__text;
	if (isLoading) {
		textClassNames += ' ' + styles['button__text--hidden'];
	}

	let buttonClassNames = styles.button;
	if (isLoading) {
		buttonClassNames += ' ' + styles['button--disabled'];
	}

	return <button
		className={buttonClassNames}
		onClick={(): void => {
			if (onClick) {
				onClick();
			}
		}}
	>
		{icon && <div className={iconClassNames}>{icon}</div>}
		<div className={textClassNames}>{text}</div>
		{
			isLoading && <div className={styles.button__loaderContainer}>
				<div className={styles.button__loaderContainer__loader}>
					<ImSpinner2 size={14}/>
				</div>
			</div>
		}
	</button>;
}

export default React.memo(ModalButton);