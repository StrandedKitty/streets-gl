import React from "react";
import styles from "./ModalCategoryContainer.scss";

const ModalCategoryContainer: React.FC<{
	children: React.ReactNode;
}> = ({children}) => {
	return (
		<div className={styles.categoryContainer}>
			{children}
		</div>
	);
};

export default React.memo(ModalCategoryContainer);