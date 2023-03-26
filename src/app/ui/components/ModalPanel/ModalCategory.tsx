import React from "react";
import styles from "./ModalCategory.scss";

const ModalCategory: React.FC<{
	label?: string;
	children: React.ReactNode;
}> = ({label, children}) => {
	return (
		<div className={styles.category}>
			{
				label && <div className={styles.category__title}>{label}</div>
			}
			<div className={styles.category__body}>{children}</div>
		</div>
	);
};

export default React.memo(ModalCategory);