import React from "react";
import styles from "./PanelCloseButton.scss";

const PanelCloseButton: React.FC<{
	onClick: () => void;
}> = ({onClick}) => {
	return <button
		className={styles.button}
		onClick={onClick}
	>×</button>
}

export default React.memo(PanelCloseButton);