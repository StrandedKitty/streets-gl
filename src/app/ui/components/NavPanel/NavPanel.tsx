import React from "react";
import styles from './NavPanel.scss';
import {FaMapMarkerAlt} from "react-icons/fa";
import {AiOutlineInfo} from "react-icons/ai";
import {IoSettingsOutline} from 'react-icons/io5';

const buttons: {name: string; icon: React.ReactNode}[] = [
	{
		name: 'savedPlaces',
		icon: <FaMapMarkerAlt size={24}/>
	}, {
		name: 'settings',
		icon: <IoSettingsOutline size={24}/>
	}, {
		name: 'info',
		icon: <AiOutlineInfo size={24}/>
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