import React from "react";
import {IoInformationOutline, IoSettingsOutline} from 'react-icons/io5';
import styles from './NavPanel.scss';

const buttons = [
	{
		name: 'settings',
		icon: <IoSettingsOutline size={24}/>
	}, {
		name: 'info',
		icon: <IoInformationOutline size={24}/>
	}
];

const NavPanel: React.FC<{
	setActiveModalWindow: (name: string) => void;
	activeModalWindow: string;
}> = (
	{
		setActiveModalWindow,
		activeModalWindow
	}
) => {
	return (
		<div className={styles.nav}>
			{
				buttons.map(({name, icon}) => {
					let className = styles.nav__icon;

					if (activeModalWindow === name) {
						className += ' ' + styles['nav__icon--active'];
					}

					return <button
						key={name}
						className={className}
						onClick={(): void => {
							if (activeModalWindow === name) {
								setActiveModalWindow('');
							} else {
								setActiveModalWindow(name);
							}
						}}
					>
						{icon}
					</button>;
				})
			}
		</div>
	);
}

export default React.memo(NavPanel);