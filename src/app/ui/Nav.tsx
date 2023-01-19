import React from "react";
import {IoInformationOutline, IoSettingsOutline} from 'react-icons/io5';

const Nav: React.FC<{
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
			<button
				className={'nav-icon' + (activeModalWindow === 'settings' ? ' nav-icon-active' : '')}
				onClick={(): void => {
					if (activeModalWindow === 'settings') {
						setActiveModalWindow('');
					} else {
						setActiveModalWindow('settings');
					}
				}}
			>
				<IoSettingsOutline size={24}/>
			</button>
			<button
				className={'nav-icon' + (activeModalWindow === 'info' ? ' nav-icon-active' : '')}
				onClick={(): void => {
					if (activeModalWindow === 'info') {
						setActiveModalWindow('');
					} else {
						setActiveModalWindow('info');
					}
				}}
			>
				<IoInformationOutline size={24}/>
			</button>
		</div>
	);
}

export default Nav;