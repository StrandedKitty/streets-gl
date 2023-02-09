import React from "react";
import {IoInformationOutline, IoSettingsOutline} from 'react-icons/io5';
import './NavPanel.scss';

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
		<div className='nav'>
			{
				buttons.map(({name, icon}) => {
					let className = 'nav-icon';

					if (activeModalWindow === name) {
						className += ' nav-icon-active';
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