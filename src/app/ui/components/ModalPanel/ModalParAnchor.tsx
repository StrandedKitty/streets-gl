import React from "react";
import styles from './ModalParAnchor.scss';

const ModalParAnchor: React.FC<{
	children: React.ReactNode;
	href: string;
}> = ({children, href}) => {
	return <a
		href={href}
		target={'_blank'}
		className={styles.anchor}
	>
		{children}
	</a>
}

export default React.memo(ModalParAnchor);